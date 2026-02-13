import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData } from '../../../src/models/GameData';

describe('Field Group: General Information', () => {
    it('should parse General Information links', () => {
        const wikitext = `
''' General information '''
* {{mm}} [http://www.terrariaonline.com/forums/ Official forums]
* {{mm}} [http://www.terraria.org/issues.html List of Issues] - Provided by developers
* {{mm}} [http://steamcommunity.com/app/105600/discussions/ Steam Community Discussions]
`;
        const data = parseWikitext(wikitext);
        expect(data.generalInfo).toHaveLength(3);

        expect(data.generalInfo[0].type).toBe('link');
        expect(data.generalInfo[0].label).toBe('Official forums');
        expect(data.generalInfo[0].url).toBe('http://www.terrariaonline.com/forums/');

        expect(data.generalInfo[1].label).toBe('List of Issues');
        expect(data.generalInfo[1].note).toBe('Provided by developers');

        expect(data.generalInfo[2].label).toBe('Steam Community Discussions');
    });

    it('should parse General Information GOG links', () => {
        const wikitext = `
''' General information '''
{{GOG.com links|1207665503|terraria}}
`;
        const data = parseWikitext(wikitext);
        expect(data.generalInfo).toHaveLength(1);
        expect(data.generalInfo[0].type).toBe('gog');
        expect(data.generalInfo[0].id).toBe('1207665503');
        expect(data.generalInfo[0].url).toBe('terraria');
    });

    it('should write General Information links', () => {
        const data = {
            generalInfo: [
                { type: 'link', label: 'Label 1', url: 'http://url1', note: 'Note 1' },
                { type: 'gog', id: '123', url: 'slug' }
            ]
        };

        const writer = new PCGWEditor('');
        writer.updateGeneralInfo(data.generalInfo as any);
        const text = writer.getText();

        expect(text).toContain("'''General information'''");
        expect(text).toContain('* {{mm}} [http://url1 Label 1] - Note 1');
        expect(text).toContain('{{GOG.com links|123|slug}}');
    });
});
