
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NetworkForm from '../../../src/components/NetworkForm.vue';
import { SettingsNetwork } from '../../../src/models/GameData';

// Mock Components
const RatingRowStub = {
    template: '<div class="rating-row-stub" :data-label="label" :data-value="value"></div>',
    props: ['label', 'value', 'notes', 'reference', 'icon'],
    emits: ['update:value', 'update:notes', 'update:reference']
};

const PanelStub = {
    template: '<div><slot /></div>'
};

const InputTextStub = {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="p-inputtext" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
};

const SelectStub = {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt" :value="opt">{{opt}}</option></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue']
};

describe('NetworkForm.vue', () => {
    const createNetworkSettings = (): SettingsNetwork => ({
        localPlay: 'unknown',
        lanPlay: 'unknown',
        onlinePlay: 'unknown',
        asynchronous: 'unknown',
        crossplay: 'unknown',
        matchmaking: 'unknown',
        p2p: 'unknown',
        dedicated: 'unknown',
        selfHosting: 'unknown',
        directIp: 'unknown',
        tcpPorts: '',
        udpPorts: '',
        upnp: 'unknown'
    });

    const setupWrapper = (networkProps: Partial<SettingsNetwork> = {}) => {
        const network = { ...createNetworkSettings(), ...networkProps };
        return {
            wrapper: mount(NetworkForm, {
                props: { network },
                global: {
                    stubs: {
                        RatingRow: RatingRowStub,
                        Panel: PanelStub,
                        InputText: InputTextStub,
                        Select: SelectStub
                    }
                }
            }),
            network
        };
    };

    it('renders all main rating rows', () => {
        const { wrapper } = setupWrapper();

        const ratingLabels = [
            'Supported', // Appears 3 times (Local, LAN, Online)
            'Asynchronous',
            'Crossplay',
            'Matchmaking',
            'Peer-to-peer',
            'Dedicated',
            'Self-hosting',
            'Direct IP'
        ];

        ratingLabels.forEach(label => {
            const rows = wrapper.findAllComponents(RatingRowStub).filter(w => w.props('label') === label);
            expect(rows.length).toBeGreaterThan(0);
        });
    });

    it('binds players and modes inputs correctly', async () => {
        const { wrapper, network } = setupWrapper();

        // Setup identifiers for specific inputs (based on placeholder or order could be tricky, 
        // but let's assume standard InputTextStub works and we find them by model binding simulation)

        // Since we bind v-model="network.localPlayPlayers", we can check if updating input updates the prop object
        // We have multiple inputs. 
        // Local Play Players is the first input (index 0)
        // Local Play Modes is index 1
        // LAN Play Players is index 2
        // LAN Play Modes is index 3
        // Online Play Players is index 4
        // Online Play Modes is index 5
        // Crossplay Platforms is index 6
        // TCP Ports is index 7
        // UDP Ports is index 8

        const inputs = wrapper.findAllComponents(InputTextStub);

        // Test Local Play Players
        await inputs[0].vm.$emit('update:modelValue', '2-4');
        expect(network.localPlayPlayers).toBe('2-4');

        // Test Online Play Modes
        await inputs[5].vm.$emit('update:modelValue', 'Co-op');
        expect(network.onlinePlayModes).toBe('Co-op');

        // Test Crossplay Platforms
        await inputs[6].vm.$emit('update:modelValue', 'PC, PS5');
        expect(network.crossplayPlatforms).toBe('PC, PS5');
    });

    it('binds ports inputs correctly', async () => {
        const { wrapper, network } = setupWrapper();
        const inputs = wrapper.findAllComponents(InputTextStub);

        // TCP Ports (Index 7)
        await inputs[7].vm.$emit('update:modelValue', '8080');
        expect(network.tcpPorts).toBe('8080');

        // UDP Ports (Index 8)
        await inputs[8].vm.$emit('update:modelValue', '3000');
        expect(network.udpPorts).toBe('3000');
    });

    it('binds UPnP select correctly', async () => {
        const { wrapper, network } = setupWrapper();
        const select = wrapper.findComponent(SelectStub);

        await select.vm.$emit('update:modelValue', 'true');
        expect(network.upnp).toBe('true');
    });
});
