import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import DynamicField from '../../../src/components/schema/DynamicField.vue';
import InputText from 'primevue/inputtext';
import Tooltip from 'primevue/tooltip';

vi.mock('lucide-vue-next', () => ({
    Info: { template: '<span class="icon-info"></span>' }
}));

describe('DynamicField.vue - IGDB Pre-fill and Disable Logic', () => {
    const fieldDef = {
        key: 'links.igdb',
        label: 'IGDB Slug',
        component: 'InputText',
        description: 'Slug from IGDB URL'
    };

    it('keeps field enabled and editable when no IGDB is in reception', async () => {
        const formModel = ref({
            reception: [],
            links: { igdb: 'some-original-slug' }
        });

        const wrapper = mount(DynamicField, {
            props: {
                field: fieldDef as any,
                modelValue: formModel.value.links.igdb,
                formModel: formModel.value
            }
        });

        // Find the input element (primevue InputText or native input)
        const input = wrapper.findComponent(InputText);
        expect(input.exists()).toBe(true);
        expect(input.props('disabled')).toBeFalsy();
        expect(input.props('modelValue')).toBe('some-original-slug');

        // Check tooltip description and helper text
        const label = wrapper.find('label');
        expect(label.text()).toContain('IGDB Slug');
        
        // Helper text should not be present
        expect(wrapper.text()).not.toContain('This field is automatically compiled from the IGDB entry in the Reception section.');
    });

    it('disables and pre-fills the field when IGDB exists in reception', async () => {
        const formModel = ref({
            reception: [
                { aggregator: 'IGDB', id: 'reception-slug-123', score: '80' }
            ],
            links: { igdb: 'some-original-slug' }
        });

        // Track model updates
        let updatedValue = 'some-original-slug';
        const wrapper = mount(DynamicField, {
            props: {
                field: fieldDef as any,
                modelValue: formModel.value.links.igdb,
                formModel: formModel.value,
                'onUpdate:modelValue': (val: any) => {
                    updatedValue = val;
                }
            }
        });

        // Check if model value was updated by watcher
        await nextTick();
        expect(updatedValue).toBe('reception-slug-123');

        // Re-mount with the updated modelValue to test display
        const wrapperWithPreFilled = mount(DynamicField, {
            props: {
                field: fieldDef as any,
                modelValue: 'reception-slug-123',
                formModel: formModel.value
            },
            global: {
                directives: { tooltip: Tooltip }
            }
        });

        const input = wrapperWithPreFilled.findComponent(InputText);
        expect(input.exists()).toBe(true);
        expect(input.props('disabled')).toBe(true);
        expect(input.props('modelValue')).toBe('reception-slug-123');

        // Helper text is exposed as a tooltip on the Info icon, not inline
        const tooltipTarget = wrapperWithPreFilled.find('span.cursor-help');
        expect(tooltipTarget.exists()).toBe(true);
        expect((tooltipTarget.element as any).$_ptooltipValue).toBe('This field is automatically compiled from the IGDB entry in the Reception section.');
    });

    it('updates value reactively when the IGDB reception entry ID changes', async () => {
        const formModel = ref({
            reception: [
                { aggregator: 'IGDB', id: 'initial-slug', score: '80' }
            ],
            links: { igdb: 'initial-slug' }
        });

        let updatedValue = 'initial-slug';
        const wrapper = mount(DynamicField, {
            props: {
                field: fieldDef as any,
                modelValue: updatedValue,
                formModel: formModel.value,
                'onUpdate:modelValue': (val: any) => {
                    updatedValue = val;
                }
            }
        });

        // Modify the reception ID
        formModel.value.reception[0].id = 'updated-slug-456';
        await wrapper.setProps({ formModel: { ...formModel.value } });
        await nextTick();

        // Expect the watcher to have updated the value
        expect(updatedValue).toBe('updated-slug-456');
    });

    it('re-enables the field when the IGDB entry is removed from reception', async () => {
        const formModel = ref({
            reception: [
                { aggregator: 'IGDB', id: 'some-slug', score: '80' }
            ],
            links: { igdb: 'some-slug' }
        });

        const wrapper = mount(DynamicField, {
            props: {
                field: fieldDef as any,
                modelValue: 'some-slug',
                formModel: formModel.value
            }
        });

        // Initially disabled
        expect(wrapper.findComponent(InputText).props('disabled')).toBe(true);

        // Remove from reception
        formModel.value.reception = [];
        await wrapper.setProps({ formModel: { ...formModel.value } });
        await nextTick();

        // Should be enabled now
        expect(wrapper.findComponent(InputText).props('disabled')).toBeFalsy();
    });
});
