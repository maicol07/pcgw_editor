import { describe, it, expect } from 'vitest';
import { renderWikitextToHtml } from './renderer';

describe('renderer.ts', () => {
    describe('TOC and Heading Parsing', () => {
        it('should generate headings with the mw-linkhere suffix in the HTML', () => {
            const wikitext = '==Video==';
            const html = renderWikitextToHtml(wikitext);
            
            // The renderer should generate the heading with the specific HTML structure
            expect(html).toContain('<h2');
            expect(html).toContain('id="Video"');
            expect(html).toContain('class="mw-linkhere"');
            expect(html).toContain('Video');
        });
    });

    describe('System Requirements Tables', () => {
        it('should generate a single system requirements table with proper structure', () => {
            const wikitext = `
{{System requirements
|OSfamily=Windows
|minos=10
}}
`;
            const html = renderWikitextToHtml(wikitext);
            
            // Should contain the table structure but NO tabs
            expect(html).not.toContain('id="tabNav"');
            expect(html).toContain('table-sysreqs-windows');
            expect(html).toContain('sysreq_Windows');
            expect(html).toContain('<th colspan="5" class="table-sysreqs-head-OS">Windows</th>');
            
            // Should contain data
            expect(html).toContain('Operating system (OS)');
            expect(html).toContain('10');
        });

        it('should fallback to Windows if OSfamily is missing', () => {
            const wikitext = `
{{System requirements
|minos=10
}}
`;
            const html = renderWikitextToHtml(wikitext);
            
            expect(html).toContain('sysreq_Windows');
            expect(html).not.toContain('id="tabNav"'); // No grouping if only one generic table
        });
        
        it('should correctly parse Mac OS as well', () => {
             const wikitext = `
{{System requirements
|OSfamily=Mac OS
|minos=10.15
}}
`;
            const html = renderWikitextToHtml(wikitext);
            
            expect(html).toContain('sysreq_Mac OS');
            expect(html).toContain('Mac OS');
        });
    });
});
