import { describe, it, expect } from 'vitest';
import { PCGWEditor } from '../wikitext';
import { initialGameData, GameData } from '../../models/GameData';

describe('PCGWEditor Taxonomy', () => {
    it('should update taxonomy fields', () => {
        const data: GameData = JSON.parse(JSON.stringify(initialGameData));
        data.infobox.taxonomy.monetization = { value: 'One-time purchase', note: 'No MTX' };
        data.infobox.taxonomy.microtransactions = { value: 'None' };
        data.infobox.taxonomy.modes = { value: 'Singleplayer, Multiplayer' };

        const wikitext = '{{Infobox game}}';
        const editor = new PCGWEditor(wikitext);
        editor.updateInfobox(data.infobox);
        const newWikitext = editor.getText();

        // Check for monetization
        // Expected format: {{Infobox game/row/taxonomy/monetization|One-time purchase|note=No MTX}}
        expect(newWikitext).toContain('{{Infobox game/row/taxonomy/monetization|One-time purchase');
        expect(newWikitext).toContain('note=No MTX');

        // Check for microtransactions
        expect(newWikitext).toContain('{{Infobox game/row/taxonomy/microtransactions|None}}');

        // Check for modes
        expect(newWikitext).toContain('{{Infobox game/row/taxonomy/modes|Singleplayer, Multiplayer}}');
    });

    it('should update existing taxonomy fields', () => {
        const wikitext = `{{Infobox game
| taxonomy = 
{{Infobox game/row/taxonomy/monetization|Free-to-play}}
}}`;
        const data: GameData = JSON.parse(JSON.stringify(initialGameData));
        data.infobox.taxonomy.monetization = { value: 'Commercial' };

        const editor = new PCGWEditor(wikitext);
        editor.updateInfobox(data.infobox);
        const newWikitext = editor.getText();

        expect(newWikitext).toContain('{{Infobox game/row/taxonomy/monetization|Commercial}}');
        expect(newWikitext).not.toContain('Free-to-play');
    });
});
