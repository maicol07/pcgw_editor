import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../src/utils/parser';

describe('Edge Cases & Complex Parsing', () => {

    it('should parse nested Game Data templates', () => {
        const wikitext = `
==Game data==
{{Game data|
{{Game data/config|Windows|%USERPROFILE%\\Documents\\MyGame|note=Test Note}}
{{Game data/saves|Steam|{{Steam|123}}|note=Cloud}}
}}
        `;

        const data = parseWikitext(wikitext);

        // Config files
        expect(data.config.configFiles).toHaveLength(1);
        expect(data.config.configFiles[0]).toMatchObject({
            platform: 'Windows',
            paths: ['%USERPROFILE%\\Documents\\MyGame']
        });

        // Save data
        expect(data.config.saveData).toHaveLength(1);
        expect(data.config.saveData[0]).toMatchObject({
            platform: 'Steam',
            paths: ['{{Steam|123}}'] // Should preserve nested template exactly
        });
    });

    it('should handle Infobox with complex nested rows', () => {
        const wikitext = `
{{Infobox game
|developers = 
{{Infobox game/row/developer|Dev A}}
{{Infobox game/row/developer|Dev B}}
|publishers = {{Infobox game/row/publisher|Pub A}}
|engines = {{Infobox game/row/engine|Unreal Engine 5|build=5.2|ref=<ref>Source</ref>}}
}}
        `;

        const data = parseWikitext(wikitext);

        expect(data.infobox.developers).toHaveLength(2);
        expect(data.infobox.developers[0].name).toBe('Dev A');
        expect(data.infobox.developers[1].name).toBe('Dev B');

        expect(data.infobox.publishers).toHaveLength(1);
        expect(data.infobox.publishers[0].name).toBe('Pub A');

        expect(data.infobox.engines).toHaveLength(1);
        expect(data.infobox.engines[0].name).toBe('Unreal Engine 5');
        expect(data.infobox.engines[0].build).toBe('5.2');
        expect(data.infobox.engines[0].ref).toBe('<ref>Source</ref>');
    });

});
