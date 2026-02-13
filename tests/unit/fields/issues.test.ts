
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, Issue } from '../../../src/models/GameData';

describe('Section: Issues', () => {
    const issuesUnresolved: Issue[] = [
        { title: 'Issue', body: 'This is an unresolved issue.' },
        { title: 'Broken specific interaction', body: 'Details about the broken interaction.' }
    ];

    const issuesFixed: Issue[] = [
        { title: 'Issue', body: 'This is a fixed issue.' },
        { title: 'Fixed crash', body: 'Details about the fixed crash.' }
    ];

    const getCleanData = (): GameData => ({
        pageTitle: '',
        articleState: {},
        infobox: {} as any,
        introduction: {} as any,
        availability: [],
        gameData: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any },
        video: {}, input: {}, audio: {}, network: {}, vr: {}, localizations: [], api: {},
        systemRequirements: { windows: {}, mac: {}, linux: {} } as any,
        monetization: {}, microtransactions: {},
        config: { configFiles: [], saveData: [], xdg: null, cloudSync: {} as any },
        issuesFixed: [],
        issuesUnresolved: [],
        dlc: [],
        galleries: { video: [], input: [], audio: [], vr: [], network: [], other: [], systemReq: [], game_data: [] }
    } as any);

    describe('Parsing', () => {
        it('should parse unresolved issues', () => {
            const wikitext = `
==Issues unresolved==
===Issue===
This is an unresolved issue.

===Broken specific interaction===
Details about the broken interaction.
`;
            const data = parseWikitext(wikitext);
            expect(data.issuesUnresolved).toHaveLength(2);
            expect(data.issuesUnresolved[0]).toEqual(issuesUnresolved[0]);
            expect(data.issuesUnresolved[1]).toEqual(issuesUnresolved[1]);
        });

        it('should parse fixed issues', () => {
            const wikitext = `
==Issues fixed==
===Issue===
This is a fixed issue.

===Fixed crash===
Details about the fixed crash.
`;
            const data = parseWikitext(wikitext);
            expect(data.issuesFixed).toHaveLength(2);
            expect(data.issuesFixed[0]).toEqual(issuesFixed[0]);
            expect(data.issuesFixed[1]).toEqual(issuesFixed[1]);
        });

        it('should parse both sections', () => {
            const wikitext = `
==Issues unresolved==
===Issue===
Unresolved.

==Issues fixed==
===Issue===
Fixed.
`;
            const data = parseWikitext(wikitext);
            expect(data.issuesUnresolved).toHaveLength(1);
            expect(data.issuesUnresolved[0].body.trim()).toBe('Unresolved.');
            expect(data.issuesFixed).toHaveLength(1);
            expect(data.issuesFixed[0].body.trim()).toBe('Fixed.');
        });
    });

    describe('Writing', () => {
        it('should write unresolved issues', () => {
            const data = getCleanData();
            data.issuesUnresolved = issuesUnresolved;

            const editor = new PCGWEditor('');
            editor.updateIssues(data.issuesUnresolved, 'unresolved');

            const output = editor.getText();
            expect(output).toContain('==Issues unresolved==');
            expect(output).toContain('===Issue===');
            expect(output).toContain('This is an unresolved issue.');
            expect(output).toContain('===Broken specific interaction===');
        });

        it('should write fixed issues', () => {
            const data = getCleanData();
            data.issuesFixed = issuesFixed;

            const editor = new PCGWEditor('');
            editor.updateIssues(data.issuesFixed, 'fixed');

            const output = editor.getText();
            expect(output).toContain('==Issues fixed==');
            expect(output).toContain('===Issue===');
            expect(output).toContain('This is a fixed issue.');
        });
    });
});
