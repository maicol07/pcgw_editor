import { describe, it } from 'vitest';
import { wikitextToHtml } from '../../../src/utils/htmlWikitextConverter';

describe('wikitextToHtml Bug check', () => {
    it('converts bullet list to HTML', () => {
        const input = "test\n* 5\n* 56\n*";
        console.log("Output HTML:\n", wikitextToHtml(input));
    });
});
