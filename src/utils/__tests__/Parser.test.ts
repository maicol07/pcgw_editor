
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../parser';
import { initialGameData } from '../../models/GameData';

describe('WikitextParser', () => {
    it('should parse Input fields correctly', () => {
        const wikitext = `{{Input
|keyboard and mouse prompts = true
|xbox prompts = true
|playstation prompts = true
|playstation controller models = DualShock 4, DualSense
|playstation connection modes = USB, Bluetooth
|nintendo connection modes = USB
}}`;
        const data = parseWikitext(wikitext);

        expect(data.input.keyboardMousePrompts).toBe('true');
        expect(data.input.xboxPrompts).toBe('true');
        expect(data.input.playstationPrompts).toBe('true');
        expect(data.input.playstationControllerModels).toBe('DualShock 4, DualSense');
        expect(data.input.playstationConnectionModes).toBe('USB, Bluetooth');
        expect(data.input.nintendoConnectionModes).toBe('USB');
    });

    it('should parse Middleware correctly', () => {
        const wikitext = `{{Middleware
|audio = FMOD
|audio notes = EventSystem
|physics = Havok
}}`;
        const data = parseWikitext(wikitext);

        expect(data.middleware.audio).toBe('FMOD');
        expect(data.middleware.audioNotes).toBe('EventSystem');
        expect(data.middleware.physics).toBe('Havok');
    });
});
