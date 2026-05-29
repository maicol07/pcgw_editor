import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DynamicField from '../../../src/components/schema/DynamicField.vue';
import { FieldDefinition } from '../../../src/types/schema';

// Mock PrimeVue components
const SelectStub = {
  template: `
    <div class="select-stub">
      <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
      <div v-for="opt in options" :key="opt.value" class="opt">{{ opt.label }}</div>
    </div>
  `,
  props: ['modelValue', 'options', 'editable'],
  emits: ['update:modelValue']
};

const MultiSelectStub = {
  template: `
    <div class="multiselect-stub">
      <input class="filter-input" @input="$emit('filter', { value: $event.target.value })" />
      <slot name="value" :value="modelValue" :placeholder="'Select...'" />
      <slot name="footer" />
      <div v-for="opt in options" :key="opt" class="opt">{{ opt }}</div>
    </div>
  `,
  props: ['modelValue', 'options'],
  emits: ['update:modelValue', 'filter']
};

const ButtonStub = {
  template: '<button class="button-stub" @click="$emit(\'click\')"><slot /></button>',
  emits: ['click']
};

// Mock dependencies
vi.mock('../../../src/utils/icons', () => ({
  getIconSrc: () => ''
}));

describe('DynamicField.vue - Custom Value support', () => {
  it('Select: converts single-select to editable and merges custom modelValue into options', async () => {
    const field: any = {
      key: 'license',
      label: 'License',
      component: 'Select',
      componentProps: {
        options: [
          { label: 'Proprietary', value: 'Proprietary' },
          { label: 'Open Source', value: 'Open Source' }
        ]
      }
    };

    const wrapper = mount(DynamicField, {
      props: {
        field: field as FieldDefinition,
        modelValue: 'Custom License'
      },
      global: {
        stubs: {
          Select: SelectStub,
          Button: ButtonStub
        }
      }
    });

    const select = wrapper.findComponent(SelectStub);
    expect(select.exists()).toBe(true);
    expect(select.props('editable')).toBe(true);

    // Verify 'Custom License' has been merged into the options list
    const options = select.props('options') as any[];
    expect(options).toContainEqual({ label: 'Custom License', value: 'Custom License' });
  });

  it('MultiSelect: dynamically displays add button in footer on filter and adds to selection', async () => {
    const field: any = {
      key: 'devices',
      label: 'Devices',
      component: 'MultiSelect',
      componentProps: {
        options: ['Keyboard', 'Mouse']
      }
    };

    const wrapper = mount(DynamicField, {
      props: {
        field: field as FieldDefinition,
        modelValue: 'Keyboard'
      },
      global: {
        stubs: {
          MultiSelect: MultiSelectStub,
          Button: ButtonStub
        }
      }
    });

    const multiselect = wrapper.findComponent(MultiSelectStub);
    expect(multiselect.exists()).toBe(true);

    // Trigger filter with custom text "VR Headset"
    const filterInput = multiselect.find('.filter-input');
    await filterInput.setValue('VR Headset');
    await filterInput.trigger('input');

    // Button should now be rendered in the footer
    const addBtn = wrapper.findComponent(ButtonStub);
    expect(addBtn.exists()).toBe(true);
    expect(addBtn.text()).toContain("+ Add 'VR Headset'");

    // Click to add
    await addBtn.trigger('click');

    // Verify it emitted the updated value containing both original and custom value
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toBe('Keyboard, VR Headset');
  });
});
