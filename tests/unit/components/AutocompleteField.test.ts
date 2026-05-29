import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AutocompleteField from '../../../src/components/AutocompleteField.vue';

// Mock PrimeVue components
const MultiSelectStub = {
  template: `
    <div class="multiselect-stub">
      <input class="filter-input" @input="$emit('filter', { value: $event.target.value })" />
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

// Mock pcgwApi
vi.mock('../../../src/services/pcgwApi', () => ({
  pcgwApi: {
    searchCompanies: vi.fn().mockResolvedValue(['Epic Games', 'Steam'])
  }
}));

describe('AutocompleteField.vue - Custom Value support', () => {
  it('allows adding custom search query to selected values in MultiSelect mode', async () => {
    const wrapper = mount(AutocompleteField, {
      props: {
        modelValue: [],
        dataSource: 'companies',
        multiple: true
      },
      global: {
        stubs: {
          MultiSelect: MultiSelectStub,
          Button: ButtonStub,
          AutoComplete: true
        }
      }
    });

    const multiselect = wrapper.findComponent(MultiSelectStub);
    expect(multiselect.exists()).toBe(true);

    // Trigger filter search
    const filterInput = multiselect.find('.filter-input');
    await filterInput.setValue('Nintendo');
    await filterInput.trigger('input');

    // Footer button should be shown
    const addBtn = wrapper.findComponent(ButtonStub);
    expect(addBtn.exists()).toBe(true);
    expect(addBtn.text()).toContain("+ Add 'Nintendo'");

    // Click custom value button
    await addBtn.trigger('click');
    await wrapper.vm.$nextTick();

    // Verify Nintendo is now in the selected list
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toContain('Nintendo');
  });
});
