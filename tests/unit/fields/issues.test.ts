
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, Issue } from '../../../src/models/GameData';

describe('Section: Issues', () => {
    const issuesUnresolved: Issue[] = [
        { title: 'Issue', body: 'This is an unresolved issue.', fixed: false },
        { title: 'Broken specific interaction', body: 'Details about the broken interaction.', fixed: false }
    ];

    const issuesFixed: Issue[] = [
        { title: 'Issue', body: 'This is a fixed issue.', fixed: true },
        { title: 'Fixed crash', body: 'Details about the fixed crash.', fixed: true }
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
        issues: [],
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
            const unresolved = data.issues.filter(i => !i.fixed);
            expect(unresolved).toHaveLength(2);
            expect(unresolved[0]).toEqual(issuesUnresolved[0]);
            expect(unresolved[1]).toEqual(issuesUnresolved[1]);
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
            const fixed = data.issues.filter(i => i.fixed);
            expect(fixed).toHaveLength(2);
            expect(fixed[0]).toEqual(issuesFixed[0]);
            expect(fixed[1]).toEqual(issuesFixed[1]);
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
            const unresolved = data.issues.filter(i => !i.fixed);
            const fixed = data.issues.filter(i => i.fixed);

            expect(unresolved).toHaveLength(1);
            expect(unresolved[0].body.trim()).toBe('Unresolved.');
            expect(fixed).toHaveLength(1);
            expect(fixed[0].body.trim()).toBe('Fixed.');
        });
    });

    describe('Writing', () => {
        it('should write unresolved issues', () => {
            const data = getCleanData();
            data.issues = issuesUnresolved;

            const editor = new PCGWEditor('');
            editor.updateIssues(data.issues);

            const output = editor.getText();
            expect(output).toContain('==Issues unresolved==');
            expect(output).toContain('===Issue===');
            expect(output).toContain('This is an unresolved issue.');
            expect(output).toContain('===Broken specific interaction===');
        });

        it('should write fixed issues', () => {
            const data = getCleanData();
            data.issues = issuesFixed;

            const editor = new PCGWEditor('');
            editor.updateIssues(data.issues);

            const output = editor.getText();
            expect(output).toContain('==Issues fixed==');
            expect(output).toContain('===Issue===');
            expect(output).toContain('This is a fixed issue.');
        });
    });
});
