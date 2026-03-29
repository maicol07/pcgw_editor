import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PublishDiffDialog from '../../../../src/components/common/PublishDiffDialog.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    UploadCloud: { template: '<span class="upload-cloud-icon"></span>' },
    GitCompare: { template: '<span class="git-compare-icon"></span>' }
}));

// Mock Shiki
vi.mock('shiki', () => ({
    codeToHtml: vi.fn().mockResolvedValue('<html>code</html>')
}));

// Mock MisMerge2
vi.mock('@mismerge/vue', () => ({
    MisMerge2: { template: '<div class="mismerge-stub"></div>', props: ['lhs', 'rhs'] }
}));

describe('PublishDiffDialog.vue', () => {
    const defaultProps = {
        visible: true,
        localWikitext: 'local text',
        onlineWikitext: 'online text',
        pageTitle: 'Test Game',
        isPublishing: false
    };

    const setupWrapper = (props = {}) => {
        return mount(PublishDiffDialog, {
            props: { ...defaultProps, ...props },
            global: {
                components: { Dialog, Button, InputText, Checkbox },
                stubs: {
                    Dialog: {
                        template: '<div><slot></slot></div>',
                        props: ['visible', 'header']
                    }
                }
            }
        });
    };

    it('renders dialog when visible is true', () => {
        const wrapper = setupWrapper();
        expect(wrapper.text()).toContain('Test Game');
        expect(wrapper.find('.mismerge-stub').exists()).toBe(true);
    });

    it('handles cancel click properly', async () => {
        const wrapper = setupWrapper();
        const buttons = wrapper.findAllComponents(Button);
        const cancelBtn = buttons.find(b => b.props('label') === 'Cancel');
        
        expect(cancelBtn).toBeDefined();
        // Since we stub Dialog, Button handles click naturally, but let's call click on its element
        await cancelBtn!.trigger('click');
        
        // Button is a custom component, we should emit from it or trigger on its wrapper
        // But for primevue buttons, .trigger('click') usually works, wait, maybe not. Let's try native trigger
        // Just in case, try emitting if trigger didn't cause standard click. Wait, primevue button natively listens to click.

        expect(wrapper.emitted('update:visible')).toBeTruthy();
        expect(wrapper.emitted('update:visible')![0]).toEqual([false]);
    });

    it('emits publish payload when publish is clicked', async () => {
        const wrapper = setupWrapper();
        
        const summaryInput = wrapper.findComponent(InputText);
        await summaryInput.setValue('Refactored wikitext');

        const checkbox = wrapper.findComponent(Checkbox);
        await checkbox.setValue(true);

        const buttons = wrapper.findAllComponents(Button);
        const publishBtn = buttons.find(b => b.props('label') === 'Publish Changes');
        
        expect(publishBtn).toBeDefined();
        await publishBtn!.trigger('click');

        expect(wrapper.emitted('publish')).toBeTruthy();
        expect(wrapper.emitted('publish')![0]).toEqual([{
            summary: 'Refactored wikitext',
            minor: true
        }]);
    });

    it('disables inputs when isPublishing is true', async () => {
        const wrapper = setupWrapper({ isPublishing: true });
        
        const summaryInput = wrapper.findComponent(InputText);
        expect(summaryInput.props('disabled')).toBe(true);

        const checkbox = wrapper.findComponent(Checkbox);
        expect(checkbox.props('disabled')).toBe(true);

        const buttons = wrapper.findAllComponents(Button);
        const cancelBtn = buttons.find(b => b.props('label') === 'Cancel');
        expect(cancelBtn!.attributes('disabled')).toBeDefined();

        const publishBtn = buttons.find(b => b.props('label') === 'Publish Changes');
        expect(publishBtn!.props('loading')).toBe(true);
    });
});
