
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../parser';
import { PCGWEditor } from '../wikitext';

describe('Localizations Parsing', () => {
    it('should parse L10n/switch templates correctly', () => {
        const wikitext = `{{L10n|content=
{{L10n/switch
 |language  = English
 |interface = true
 |audio     = true
 |subtitles = true
 |notes     = 
 |fan       = 
 |ref       = 
}}
{{L10n/switch
 |language  = Korean
 |interface = true
 |audio     = false
 |subtitles = true
 |notes     = Some notes
 |fan       = 
 |ref       = 
}}
}}`;
        const data = parseWikitext(wikitext);

        expect(data.localizations).toHaveLength(2);

        expect(data.localizations[0]).toEqual({
            language: 'English',
            interface: true,
            audio: 'true',
            subtitles: 'true',
            notes: '',
            fan: false,
            ref: ''
        });

        expect(data.localizations[1]).toEqual({
            language: 'Korean',
            interface: true,
            audio: 'false',
            subtitles: 'true',
            notes: 'Some notes',
            fan: false,
            ref: ''
        });
    });


});

describe('Localizations Writing', () => {
    it('should write L10n/switch templates correctly', () => {
        const editor = new PCGWEditor('');
        const localizations = [
            {
                language: 'English',
                interface: true,
                audio: 'true' as const,
                subtitles: 'true' as const,
                notes: '',
                fan: false,
                ref: ''
            },
            {
                language: 'French',
                interface: true,
                audio: 'false' as const,
                subtitles: 'true' as const,
                notes: 'Community patch',
                fan: true,
                ref: ''
            }
        ];

        editor.updateLocalizations(localizations);
        const wikitext = editor.getText();

        expect(wikitext).toContain('{{L10n');
        expect(wikitext).toContain('|content =');
        expect(wikitext).toContain('{{L10n/switch');
        expect(wikitext).toContain('|language  = English');
        expect(wikitext).toContain('|interface = true');
        expect(wikitext).toContain('|audio     = true');
        expect(wikitext).toContain('|subtitles = true');

        expect(wikitext).toContain('|language  = French');
        expect(wikitext).toContain('|fan       = true');
        expect(wikitext).toContain('|notes     = Community patch');
    });
});
