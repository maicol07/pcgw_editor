import { describe, it } from 'vitest';
import { htmlToWikitext } from '../../../src/utils/htmlWikitextConverter';

describe('Quill to wikitext check', () => {
    it('converts quill bullet list to HTML', () => {
        const input = '<ol><li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>Item 1</li></ol>';
        console.log("Output Wikitext:\n", htmlToWikitext(input));
    });
});
