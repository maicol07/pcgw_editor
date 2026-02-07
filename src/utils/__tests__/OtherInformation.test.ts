
import { describe, it, expect } from 'vitest';
import { generateWikitext } from '../wikitext';
import { parseWikitext } from '../parser';
import { initialGameData, GameData } from '../../models/GameData';

describe('Other Information (API & Middleware)', () => {

    describe('API Section', () => {
        it('should parse API fields correctly from wikitext', () => {
            const wikitext = `
{{API
|direct3d versions      = 11, 12
|direct3d notes         = dx notes
|opengl versions        = 4.6
|opengl notes           = gl notes
|vulkan versions        = 1.3
|vulkan notes           = vk notes
}}`;
            const data = parseWikitext(wikitext);

            expect(data.api.dxVersion).toBe('11, 12');
            expect(data.api.dxNotes).toBe('dx notes');
            expect(data.api.openGlVersion).toBe('4.6');
            expect(data.api.openGlNotes).toBe('gl notes');
            expect(data.api.vulkanVersion).toBe('1.3');
            expect(data.api.vulkanNotes).toBe('vk notes');
        });

        it('should generate wikitext correctly for API fields (create new)', () => {
            const data: GameData = JSON.parse(JSON.stringify(initialGameData));
            data.api.dxVersion = '12';
            data.api.dxNotes = 'Ray Tracing supported';
            data.api.vulkanVersion = '1.2';

            const wikitext = '{{Infobox game}}';
            const newWikitext = generateWikitext(data, wikitext);

            expect(newWikitext).toContain('{{API');
            expect(newWikitext).toContain('|direct3d versions = 12');
            expect(newWikitext).toContain('|direct3d notes = Ray Tracing supported');
            expect(newWikitext).toContain('|vulkan versions = 1.2');
        });

        it('should update existing API fields in wikitext', () => {
            const wikitext = `
{{Infobox game}}
{{API
|direct3d versions = 9
|direct3d notes = old notes
}}`;
            const data = parseWikitext(wikitext);
            // Verify initial state
            expect(data.api.dxVersion).toBe('9');

            // specific update
            data.api.dxVersion = '11';
            data.api.dxNotes = 'Updated notes';

            const newWikitext = generateWikitext(data, wikitext);

            expect(newWikitext).toContain('|direct3d versions = 11');
            expect(newWikitext).toContain('|direct3d notes = Updated notes');
            // Should not contain old values
            expect(newWikitext).not.toContain('|direct3d versions = 9');
        });
    });

    describe('Middleware Section', () => {
        it('should parse Middleware fields correctly', () => {
            const wikitext = `
{{Middleware
|physics     = PhysX
|physics notes = Hardware accelerated
|audio       = FMOD
}}`;
            const data = parseWikitext(wikitext);

            expect(data.middleware.physics).toBe('PhysX');
            expect(data.middleware.physicsNotes).toBe('Hardware accelerated');
            expect(data.middleware.audio).toBe('FMOD');
        });

        it('should generate wikitext correctly for Middleware (create new)', () => {
            const data: GameData = JSON.parse(JSON.stringify(initialGameData));
            data.middleware.physics = 'Havok';
            data.middleware.interface = 'Scaleform';
            data.middleware.interfaceNotes = 'UI Middleware';

            const wikitext = '{{Infobox game}}';
            const newWikitext = generateWikitext(data, wikitext);

            expect(newWikitext).toContain('{{Middleware');
            expect(newWikitext).toContain('|physics = Havok');
            expect(newWikitext).toContain('|interface = Scaleform');
            expect(newWikitext).toContain('|interface notes = UI Middleware');
        });

        it('should update existing Middleware fields', () => {
            const wikitext = `
{{Middleware
|physics = PhysX
}}`;
            const data = parseWikitext(wikitext);
            data.middleware.physics = 'Havok';
            data.middleware.physicsNotes = 'Replaced PhysX';

            const newWikitext = generateWikitext(data, wikitext);

            expect(newWikitext).toContain('|physics = Havok');
            expect(newWikitext).toContain('|physics notes = Replaced PhysX');
        });
    });
});
