
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../src/utils/parser';
import { generateWikitext } from '../../src/utils/wikitext';
import { initialGameData } from '../../src/models/GameData';

describe('Field Reader/Writer Integration', () => {

    it('should read and write Input settings correctly', () => {
        const wikitext = `{{Input
|key remap = true
|key remap notes = requires config
}}`;
        const data = parseWikitext(wikitext);
        expect(data.input.keyRemap).toBe('true');
        expect(data.input.keyRemapNotes).toBe('requires config');

        // Modify
        data.input.keyRemap = 'hackable';
        data.input.mouseSensitivity = 'false';

        const newWikitext = generateWikitext(data, wikitext);
        expect(newWikitext).toContain('|key remap = hackable');
        expect(newWikitext).toContain('|mouse sensitivity = false');
        expect(newWikitext).toContain('|key remap notes = requires config');
    });

    it('should read and write Audio settings correctly', () => {
        const wikitext = `{{Audio
|separate volume = true
}}`;
        const data = parseWikitext(wikitext);
        expect(data.audio.separateVolume).toBe('true');

        data.audio.separateVolume = 'false';
        data.audio.surroundSound = 'true';
        data.audio.surroundSoundNotes = 'upto 7.1';

        const newWikitext = generateWikitext(data, wikitext);
        expect(newWikitext).toContain('|separate volume = false');
        expect(newWikitext).toContain('|surround sound = true');
        expect(newWikitext).toContain('|surround sound notes = upto 7.1');
    });

    it('should read and write VR settings (flat structure)', () => {
        const wikitext = `{{VR support
|native 3d = true
}}`;
        const data = parseWikitext(wikitext);
        expect(data.vr.native3d).toBe('true');

        data.vr.native3d = 'false';
        data.vr.openXr = 'true';

        const newWikitext = generateWikitext(data, wikitext);
        expect(newWikitext).toContain('|native 3d = false');
        expect(newWikitext).toContain('|openxr = true');
    });
});
