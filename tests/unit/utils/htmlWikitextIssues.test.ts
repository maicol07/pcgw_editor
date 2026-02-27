import { describe, it, expect } from 'vitest';
import { Issue } from '../../../src/models/GameData';
import { PCGWEditor } from '../../../src/utils/wikitext';

describe('Issues wikitext generation', () => {
    it('generates Issues unresolved and Issues fixed sections correctly', () => {
        const issues: Issue[] = [
            {
                title: 'Game crashes on startup',
                fixed: false,
                body: 'This is a description of the crash.'
            },
            {
                title: 'No ultrawide support',
                fixed: true,
                body: 'Fixed by community mod xyz.'
            }
        ];

        const initialWikitext = `==Other information==\nSome info.`;
        const editor = new PCGWEditor(initialWikitext);
        editor.updateIssues(issues);
        const result = editor.getText();

        expect(result).includes('==Issues unresolved==\n===Game crashes on startup===\nThis is a description of the crash.');
        expect(result).includes('==Issues fixed==\n===No ultrawide support===\nFixed by community mod xyz.');

        // Ensure it comes before Other information
        const unresolvedIndex = result.indexOf('==Issues unresolved==');
        const otherInfoIndex = result.indexOf('==Other information==');
        expect(unresolvedIndex).toBeLessThan(otherInfoIndex);
    });

    it('removes the section if there are no more issues of that type', () => {
        const initialWikitext = `==Issues unresolved==
===Old issue===
Old desc.

==Issues fixed==
===Old fixed issue===
Old fixed desc.

==Other information==
Info`;

        const issues: Issue[] = [
            {
                title: 'New issue',
                fixed: false,
                body: 'New desc.'
            }
        ];

        const editor = new PCGWEditor(initialWikitext);
        editor.updateIssues(issues);
        const result = editor.getText();

        expect(result).includes('==Issues unresolved==\n===New issue===\nNew desc.');
        expect(result).not.includes('==Issues fixed==');
    });

    it('appends at the end if Other information is missing', () => {
        const initialWikitext = `==Some other section==\nContent.`;
        const issues: Issue[] = [
            {
                title: 'Issue 1',
                fixed: true,
                body: 'Desc 1.'
            }
        ];

        const editor = new PCGWEditor(initialWikitext);
        editor.updateIssues(issues);
        const result = editor.getText();

        expect(result).includes('==Some other section==\nContent.');
        expect(result).includes('==Issues fixed==\n===Issue 1===\nDesc 1.');
        expect(result.endsWith('\n')).toBe(true);
    });
});
