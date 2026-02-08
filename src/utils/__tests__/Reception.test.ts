import { describe, it, expect } from 'vitest';
import { PCGWEditor } from '../wikitext';
import { initialGameData, GameData } from '../../models/GameData';

describe('PCGWEditor Reception', () => {
    it('should add reception rows to wikitext', () => {
        const data: GameData = JSON.parse(JSON.stringify(initialGameData));
        data.infobox.reception = [
            { aggregator: 'Metacritic', score: '85', id: 'game-title' },
            { aggregator: 'OpenCritic', score: '82', id: '123' },
            { aggregator: 'IGDB', score: '80', id: 'game-slug' }
        ];

        const wikitext = '{{Infobox game}}';
        const editor = new PCGWEditor(wikitext);
        editor.updateInfobox(data.infobox);
        const newWikitext = editor.getText();

        // Check for the generated partial wikitext for reception content
        // The parser logic for replaceParameterContent puts the content directly as value
        // It might be nested or direct depending on implementation
        // Let's check for the substring presence first

        expect(newWikitext).toContain('{{Infobox game/row/reception|Metacritic|game-title|85}}');
        // Note: The order matters if we are strict, but here we just check presence
        expect(newWikitext).toContain('{{Infobox game/row/reception|OpenCritic|123|82}}');
        expect(newWikitext).toContain('{{Infobox game/row/reception|IGDB|game-slug|80}}');
    });

    it('should update existing reception rows', () => {
        // Pre-existing wikitext with reception (legacy/wrong order mimicking current parser expectation if that was the case, 
        // but let's assume valid wikitext: Agg|ID|Score)
        const wikitext = `{{Infobox game
| reception = 
{{Infobox game/row/reception|Metacritic|old-id|90}}
}}`;
        const data: GameData = JSON.parse(JSON.stringify(initialGameData));
        // New data to replace it
        data.infobox.reception = [
            { aggregator: 'Metacritic', score: '95', id: 'new-id' }
        ];

        const editor = new PCGWEditor(wikitext);
        editor.updateInfobox(data.infobox);
        const newWikitext = editor.getText();

        expect(newWikitext).toContain('{{Infobox game/row/reception|Metacritic|new-id|95}}');
        expect(newWikitext).not.toContain('{{Infobox game/row/reception|Metacritic|old-id|90}}');
    });

    it('should persist empty rows', () => {
        const data: GameData = JSON.parse(JSON.stringify(initialGameData));
        data.infobox.reception = [
            { aggregator: '' as any, score: '', id: '' },
            { aggregator: 'Metacritic', score: '90', id: '' }
        ];

        const wikitext = '{{Infobox game}}';
        const editor = new PCGWEditor(wikitext);
        editor.updateInfobox(data.infobox);
        const newWikitext = editor.getText();

        expect(newWikitext).toContain('{{Infobox game/row/reception|||}}');
        expect(newWikitext).toContain('{{Infobox game/row/reception|Metacritic||90}}');
    });
});
