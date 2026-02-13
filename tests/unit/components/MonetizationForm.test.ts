
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MonetizationForm from '../../../src/components/MonetizationForm.vue';
import { GameMonetization, GameMicrotransactions } from '../../../src/models/GameData';

// Mock Components
const InputTextStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="p-inputtext" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
};

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    DollarSign: { template: '<span class="icon-dollar"></span>' },
    ShoppingCart: { template: '<span class="icon-cart"></span>' }
}));

describe('MonetizationForm.vue', () => {
    const createMonetization = (): GameMonetization => ({
        oneTimePurchase: '',
        freeToPlay: '',
        freeware: '',
        adSupported: '',
        subscription: '',
        subscriptionGamingService: '',
        dlc: '',
        expansionPack: '',
        crossGameBonus: ''
    });

    const createMicrotransactions = (): GameMicrotransactions => ({
        none: '',
        cosmetic: '',
        currency: '',
        lootBox: '',
        unlock: '',
        boost: '',
        freeToGrind: '',
        finiteSpend: '',
        infiniteSpend: '',
        playerTrading: '',
        timeLimited: ''
    });

    const setupWrapper = (
        monProps: Partial<GameMonetization> = {},
        mtxProps: Partial<GameMicrotransactions> = {}
    ) => {
        const monetization = { ...createMonetization(), ...monProps };
        const microtransactions = { ...createMicrotransactions(), ...mtxProps };
        return {
            wrapper: mount(MonetizationForm, {
                props: { monetization, microtransactions },
                global: {
                    stubs: {
                        InputText: InputTextStub
                    }
                }
            }),
            monetization,
            microtransactions
        };
    };

    it('renders all monetization fields', () => {
        const { wrapper } = setupWrapper();
        const inputs = wrapper.findAllComponents(InputTextStub);
        // Monetization: 9 fields
        // Microtransactions: 11 fields
        // Total 20 inputs
        expect(inputs.length).toBe(20);
    });

    it('updates monetization field', async () => {
        const { wrapper, monetization } = setupWrapper();
        const inputs = wrapper.findAllComponents(InputTextStub);

        // One-time Purchase is first input
        await inputs[0].vm.$emit('update:modelValue', 'Included');
        expect(monetization.oneTimePurchase).toBe('Included');
    });

    it('updates microtransaction field', async () => {
        const { wrapper, microtransactions } = setupWrapper();
        const inputs = wrapper.findAllComponents(InputTextStub);

        // Microtransactions start after 9th input (index 9)
        // Check "None" (first mtx field)
        await inputs[9].vm.$emit('update:modelValue', 'False');
        expect(microtransactions.none).toBe('False');
    });
});
