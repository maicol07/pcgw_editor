import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PathInputField from '../../../src/components/ui/PathInputField.vue';

describe('PathInputField.vue', () => {
    it('renders text and special path chips correctly', () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\saves\\'
            }
        });

        const editor = wrapper.find('.path-input-editor');
        expect(editor.exists()).toBe(true);

        const chips = editor.findAll('.chip-token');
        expect(chips.length).toBe(1);
        expect(chips[0].attributes('data-token')).toBe('{{p|appdata}}');
        expect(editor.text()).toContain('MyGame\\saves\\');
    });

    it('copies selected tokens and text as raw wikitext on copy event', () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\saves\\'
            }
        });

        const editor = wrapper.find('.path-input-editor');
        const clipboardData = {
            data: {} as Record<string, string>,
            setData: vi.fn((type: string, val: string) => {
                clipboardData.data[type] = val;
            })
        };

        // When collapsed or full copy
        const copyEvent = new Event('copy', { bubbles: true, cancelable: true }) as any;
        copyEvent.clipboardData = clipboardData;
        editor.element.dispatchEvent(copyEvent);

        expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', '{{p|appdata}}\\MyGame\\saves\\');
    });

    it('pastes text and updates modelValue with parsed tags', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: 'C:\\Games\\'
            }
        });

        const editor = wrapper.find('.path-input-editor');
        const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as any;
        pasteEvent.clipboardData = {
            getData: vi.fn().mockReturnValue('{{p|appdata}}\\NewSaves\\')
        };

        editor.element.dispatchEvent(pasteEvent);

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[0][0]).toBe('C:\\Games\\{{p|appdata}}\\NewSaves\\');
    });

    it('supports insertAtCaret exposed method', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: 'C:\\Games\\'
            }
        });

        wrapper.vm.insertAtCaret('{{p|userprofile}}\\');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[0][0]).toBe('C:\\Games\\{{p|userprofile}}\\');
    });

    it('removes token when chip remove button is clicked', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\'
            }
        });

        const removeBtn = wrapper.find('.chip-remove-btn');
        expect(removeBtn.exists()).toBe(true);

        await removeBtn.trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[0][0]).toBe('\\MyGame\\');
    });

    it('clears everything when Ctrl+A followed by Backspace is pressed', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\'
            },
            attachTo: document.body
        });

        const editor = wrapper.find('.path-input-editor');

        // Trigger Ctrl+A
        await editor.trigger('keydown', { key: 'a', ctrlKey: true });

        // Trigger Backspace
        await editor.trigger('keydown', { key: 'Backspace' });

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1][0]).toBe('');

        wrapper.unmount();
    });

    it('replaces selection when typing over active selection', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\'
            },
            attachTo: document.body
        });

        const editor = wrapper.find('.path-input-editor');

        // Trigger Ctrl+A
        await editor.trigger('keydown', { key: 'a', ctrlKey: true });

        // Type 'D'
        await editor.trigger('keydown', { key: 'D' });

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1][0]).toBe('D');

        wrapper.unmount();
    });

    it('selects across token with Shift+Arrow and deletes it', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\'
            },
            attachTo: document.body
        });

        const editor = wrapper.find('.path-input-editor');

        // Position selection right after the chip (offset 15)
        const sel = window.getSelection();
        const textNode = editor.element.childNodes[1]; // text node '\MyGame\'
        if (sel && textNode) {
            sel.setBaseAndExtent(textNode, 0, textNode, 0);
        }

        // Trigger Shift + ArrowLeft (should jump to offset 0, selecting the whole chip!)
        await editor.trigger('keydown', { key: 'ArrowLeft', shiftKey: true });

        // Chip should now have chip-selected class
        const chip = editor.find('.chip-token');
        expect(chip.classes()).toContain('chip-selected');

        // Press Backspace to delete the selected token
        await editor.trigger('keydown', { key: 'Backspace' });

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        const emitted = wrapper.emitted('update:modelValue')!;
        expect(emitted[emitted.length - 1][0]).toBe('\\MyGame\\');

        wrapper.unmount();
    });

    it('selects word-by-word with Ctrl+Shift+Arrow', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\saves\\settings.ini'
            },
            attachTo: document.body
        });

        const editor = wrapper.find('.path-input-editor');

        // Position selection at the end of the text node
        const sel = window.getSelection();
        const textNode = editor.element.childNodes[1]; // text node '\MyGame\saves\settings.ini'
        if (sel && textNode) {
            sel.setBaseAndExtent(textNode, textNode.textContent!.length, textNode, textNode.textContent!.length);
        }

        // Ctrl + Shift + ArrowLeft should jump over 'ini' (stops before '.ini')
        await editor.trigger('keydown', { key: 'ArrowLeft', ctrlKey: true, shiftKey: true });

        // Then another Ctrl + Shift + ArrowLeft should jump over '.settings'
        await editor.trigger('keydown', { key: 'ArrowLeft', ctrlKey: true, shiftKey: true });

        // Copy what is selected
        const clipboardData = {
            data: {} as Record<string, string>,
            setData: vi.fn((type: string, val: string) => {
                clipboardData.data[type] = val;
            })
        };
        const copyEvent = new Event('copy', { bubbles: true, cancelable: true }) as any;
        copyEvent.clipboardData = clipboardData;
        editor.element.dispatchEvent(copyEvent);

        expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'settings.ini');

        wrapper.unmount();
    });

    it('selects chip to left, deselects it to right, and expands to right with Ctrl+Shift+Arrow', async () => {
        const wrapper = mount(PathInputField, {
            props: {
                modelValue: '{{p|appdata}}\\MyGame\\saves'
            },
            attachTo: document.body
        });

        const editor = wrapper.find('.path-input-editor');

        // Position cursor at 15 (start of text node '\MyGame\saves')
        const sel = window.getSelection();
        const textNode = editor.element.childNodes[1];
        if (sel && textNode) {
            sel.setBaseAndExtent(textNode, 0, textNode, 0);
        }

        // 1. Ctrl + Shift + ArrowLeft selects chip to the left
        await editor.trigger('keydown', { key: 'ArrowLeft', ctrlKey: true, shiftKey: true });
        const chip = editor.find('.chip-token');
        expect(chip.classes()).toContain('chip-selected');

        // 2. Ctrl + Shift + ArrowRight deselects the chip
        await editor.trigger('keydown', { key: 'ArrowRight', ctrlKey: true, shiftKey: true });
        expect(chip.classes()).not.toContain('chip-selected');

        // 3. Another Ctrl + Shift + ArrowRight selects the part to the right (\MyGame)
        await editor.trigger('keydown', { key: 'ArrowRight', ctrlKey: true, shiftKey: true });

        const clipboardData = {
            data: {} as Record<string, string>,
            setData: vi.fn((type: string, val: string) => {
                clipboardData.data[type] = val;
            })
        };
        const copyEvent = new Event('copy', { bubbles: true, cancelable: true }) as any;
        copyEvent.clipboardData = clipboardData;
        editor.element.dispatchEvent(copyEvent);

        expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', '\\MyGame');

        wrapper.unmount();
    });
});
