import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { initialGameData } from '../../../src/models/GameData';

describe('Field Group: Article State', () => {
    // Helper to get a clean state
    const getCleanData = () => {
        const data = JSON.parse(JSON.stringify(initialGameData));
        data.articleState.stub = false; // Default is true, disable for tests unless needed
        return data;
    };

    describe('Disambig', () => {
        it('should parse {{Disambig}} template with multiple values', () => {
            const wikitext = `{{Disambig|Game A|Game B}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.disambig).toEqual(['Game A', 'Game B']);
        });

        it('should write disambiguation field with multiple values', () => {
            const data = getCleanData();
            data.articleState.disambig = ['Game A', 'Game B'];
            const writer = new PCGWEditor('');
            writer.updateArticleState(data.articleState);
            expect(writer.getText()).toContain('{{Disambig|Game A|Game B}}');
        });
    });

    describe('Distinguish', () => {
        it('should parse {{Distinguish}} template with multiple values', () => {
            const wikitext = `{{Distinguish|Game A|Game B}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.distinguish).toEqual(['Game A', 'Game B']);
        });

        it('should write distinguish field with multiple values', () => {
            const data = getCleanData();
            data.articleState.distinguish = ['Game A', 'Game B'];
            const writer = new PCGWEditor('');
            writer.updateArticleState(data.articleState);
            expect(writer.getText()).toContain('{{Distinguish|Game A|Game B}}');
        });
    });

    describe('Stub Flag', () => {
        it('should parse {{Stub}} template', () => {
            const wikitext = `{{Stub}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.stub).toBe(true);
        });

        it('should write stub flag (lowercase)', () => {
            const data = getCleanData();
            data.articleState.stub = true;
            const writer = new PCGWEditor('');
            writer.updateArticleState(data.articleState);
            expect(writer.getText()).toContain('{{stub}}');
        });

        it('should remove stub flag when false', () => {
            const wikitext = `{{Stub}}\nSome content`;
            const data = getCleanData();
            data.articleState.stub = false;
            const writer = new PCGWEditor(wikitext);
            writer.updateArticleState(data.articleState);
            expect(writer.getText().toLowerCase()).not.toContain('{{stub}}');
        });
    });

    describe('Cleanup Flag', () => {
        it('should parse {{Cleanup}} template with reason', () => {
            const wikitext = `{{Cleanup|Need more info}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.cleanup).toBe(true);
            expect(data.articleState.cleanupDescription).toBe('Need more info');
        });

        it('should parse {{Cleanup}} template with numbered param', () => {
            const wikitext = `{{Cleanup|1=Need more info}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.cleanup).toBe(true);
            expect(data.articleState.cleanupDescription).toBe('Need more info');
        });

        it('should parse {{Cleanup}} template with section and reason', () => {
            const wikitext = `{{cleanup|section|Description of specific issues}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.cleanup).toBe(true);
            expect(data.articleState.cleanupDescription).toBe('section|Description of specific issues');
        });

        it('should write cleanup flag with reason (lowercase)', () => {
            const data = getCleanData();
            data.articleState.cleanup = true;
            data.articleState.cleanupDescription = 'Formatting needed';
            const writer = new PCGWEditor('');
            writer.updateArticleState(data.articleState);
            expect(writer.getText()).toContain('{{cleanup|Formatting needed}}');
        });

        it('should write cleanup flag with section and reason', () => {
            const data = getCleanData();
            data.articleState.cleanup = true;
            data.articleState.cleanupDescription = 'section|Description of specific issues';
            const writer = new PCGWEditor('');
            writer.updateArticleState(data.articleState);
            expect(writer.getText()).toContain('{{cleanup|section|Description of specific issues}}');
        });
    });

    describe('Delete Flag', () => {
        it('should parse {{Delete}} template with reason', () => {
            const wikitext = `{{Delete|Duplicate page}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.delete).toBe(true);
            expect(data.articleState.deleteReason).toBe('Duplicate page');
        });

        it('should write delete flag with reason (lowercase)', () => {
            const data = getCleanData();
            data.articleState.delete = true;
            data.articleState.deleteReason = 'Spam';
            const writer = new PCGWEditor('');
            writer.updateArticleState(data.articleState);
            expect(writer.getText()).toContain('{{delete|Spam}}');
        });
    });

    describe('Game State', () => {
        it('should parse {{State}} template', () => {
            const wikitext = `{{State|state=dev}}`;
            const data = parseWikitext(wikitext);
            expect(data.articleState.state).toBe('dev');
        });

        it('should write state field', () => {
            const data = getCleanData();
            data.articleState.state = 'abandoned';
            const writer = new PCGWEditor('');
            writer.updateArticleState(data.articleState);
            const text = writer.getText();
            expect(text).toMatch(/{{State\s*\|\s*state\s*=\s*abandoned\s*}}/i);
        });
    });
});
