import { describe, it, expect } from 'vitest';
import { generateWikitext } from '../wikitext';
import { initialGameData, GameData } from '../../models/GameData';

describe('PCGWEditor', () => {
    it('should update Audio Middleware', () => {
        const data: GameData = JSON.parse(JSON.stringify(initialGameData));
        data.middleware.audio = 'FMOD';
        data.middleware.audioNotes = 'EventSystem';

        const wikitext = '{{Infobox game}}\n{{Middleware}}';
        const newWikitext = generateWikitext(data, wikitext);

        // Check for simple field update (depending on wikitext.ts implementation)
        // If wikitext.ts uses simple mapping: |audio = FMOD
        expect(newWikitext).toContain('|audio = FMOD');
        expect(newWikitext).toContain('|audio notes = EventSystem');
    });

    it('should update specific Input fields', () => {
        const data: GameData = JSON.parse(JSON.stringify(initialGameData));
        data.input.keyboardMousePrompts = 'true';
        data.input.xboxPrompts = 'true';
        data.input.playstationPrompts = 'true';
        data.input.playstationControllerModels = 'DualShock 4, DualSense';
        data.input.playstationConnectionModes = 'USB, Bluetooth';
        data.input.nintendoConnectionModes = 'USB';

        const wikitext = '{{Infobox game}}\n{{Input}}';
        const newWikitext = generateWikitext(data, wikitext);

        // Check for missing mappings or correct updates
        expect(newWikitext).toContain('|keyboard and mouse prompts = true'); // Suspect this is the correct param name, but currently missing
        expect(newWikitext).toContain('|xbox prompts = true');
        expect(newWikitext).toContain('|playstation prompts = true');
        expect(newWikitext).toContain('|playstation controller models = DualShock 4, DualSense');
        expect(newWikitext).toContain('|playstation connection modes = USB, Bluetooth');
        expect(newWikitext).toContain('|nintendo connection modes = USB');
    });

});
