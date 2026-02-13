
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MiddlewareForm from '../../../src/components/MiddlewareForm.vue';
import { GameMiddleware } from '../../../src/models/GameData';

// Mock Components
const RatingRowStub = {
    template: '<div class="rating-row-stub" :data-label="label" :data-value="value"></div>',
    props: ['label', 'value', 'notes', 'reference', 'icon'],
    emits: ['update:value', 'update:notes', 'update:reference']
};

const PanelStub = {
    template: '<div><slot /></div>'
};

// Mock Lucide icons
vi.mock('lucide-vue-next', () => ({
    Zap: { template: '<span class="icon-zap"></span>' },
    Volume2: { template: '<span class="icon-volume2"></span>' },
    Layout: { template: '<span class="icon-layout"></span>' },
    Gamepad2: { template: '<span class="icon-gamepad2"></span>' },
    Film: { template: '<span class="icon-film"></span>' },
    Users: { template: '<span class="icon-users"></span>' },
    Shield: { template: '<span class="icon-shield"></span>' }
}));

describe('MiddlewareForm.vue', () => {
    const createMiddlewareSettings = (): GameMiddleware => ({
        physics: 'unknown',
        audio: 'unknown',
        interface: 'unknown',
        input: 'unknown',
        cutscenes: 'unknown',
        multiplayer: 'unknown',
        anticheat: 'unknown'
    });

    const setupWrapper = (middlewareProps: Partial<GameMiddleware> = {}) => {
        const middleware = { ...createMiddlewareSettings(), ...middlewareProps };
        return {
            wrapper: mount(MiddlewareForm, {
                props: { middleware },
                global: {
                    stubs: {
                        RatingRow: RatingRowStub,
                        Panel: PanelStub
                    }
                }
            }),
            middleware
        };
    };

    it('renders all middleware rows', () => {
        const { wrapper } = setupWrapper();
        const rows = wrapper.findAllComponents(RatingRowStub);

        // Physics, Audio, Interface, Input, Cutscenes, Multiplayer, Anticheat = 7
        expect(rows.length).toBe(7);

        ['Physics', 'Audio', 'Interface', 'Input', 'Cutscenes', 'Multiplayer', 'Anticheat'].forEach(label => {
            const row = wrapper.findComponent(`[data-label="${label}"]`);
            expect(row.exists()).toBe(true);
        });
    });

    it('updates middleware value', async () => {
        const { wrapper, middleware } = setupWrapper();

        const row = wrapper.findComponent('[data-label="Physics"]');
        await (row as any).vm.$emit('update:value', 'Havok');

        expect(middleware.physics).toBe('Havok');
    });
});
