import { describe, it, expect } from 'vitest';
import { WikitextParser } from './WikitextParser';
import { PCGWEditor } from './wikitext';

describe('WikitextParser - Empty Value Whitespace', () => {
    it('should not duplicate whitespace when setting empty values', () => {
        const template = `{{API
|direct3d versions      = 11
|direct3d notes         = 
|directdraw versions    = 
}}`;

        const parser = new WikitextParser(template);

        // Set direct3d notes to empty (which it already is)
        parser.setParameter('API', 'direct3d notes', '');

        const result = parser.getText();

        // Should NOT have extra newlines
        expect(result).not.toContain('|direct3d notes         = \n\n\n');
        // Should have exactly the same format as the original
        expect(result).toContain('|direct3d notes         = \n|directdraw versions');
    });

    it('should preserve exactly one space after = for empty values', () => {
        const template = `{{Video
|fps = 60
|hdr = 
|vsync = true
}}`;

        const parser = new WikitextParser(template);

        // Set hdr to empty again
        parser.setParameter('Video', 'hdr', '');

        const result = parser.getText();

        // Should maintain the original spacing
        const lines = result.split('\n');
        const hdrLine = lines.find(l => l.includes('|hdr'));

        expect(hdrLine).toBe('|hdr = ');
    });

    it('should handle updating from empty to non-empty value correctly', () => {
        const template = `{{Video
|fps = 
|hdr = 
}}`;

        const parser = new WikitextParser(template);

        // Set fps from empty to a value
        parser.setParameter('Video', 'fps', '60');

        const result = parser.getText();

        // Should have the value with proper spacing
        expect(result).toContain('|fps = 60');
        // Should NOT have extra newlines
        expect(result).not.toContain('|fps = 60\n\n\n');
    });

    it('should handle non-empty to empty value correctly', () => {
        const template = `{{Video
|fps = 60
|hdr = true
}}`;

        const parser = new WikitextParser(template);

        // Set hdr from value to empty
        parser.setParameter('Video', 'hdr', '');

        const result = parser.getText();

        // Should preserve the spacing structure
        expect(result).toContain('|hdr = ');
        expect(result).not.toContain('|hdr = \n\n');
    });
});

describe('PCGWEditor - Empty API Parameters', () => {
    it('should not add extra newlines when generating API template with empty values', () => {
        const original = `===API===
{{API
|direct3d versions      = 11
|direct3d notes         = 
|opengl versions        = 
|opengl notes           = 
|vulkan versions        = 
|vulkan notes           = 
}}`;

        const editor = new PCGWEditor(original);

        // Simulate updating API values (some empty, some not)
        editor.setTemplateParam('API', 'direct3d versions', '11');
        editor.setTemplateParam('API', 'direct3d notes', '');
        editor.setTemplateParam('API', 'opengl versions', '');
        editor.setTemplateParam('API', 'opengl notes', '');

        const result = editor.getText();

        // Should NOT have multiple consecutive blank lines
        expect(result).not.toContain('\n\n\n\n');
        expect(result).not.toContain('|direct3d notes         = \n\n\n');
        expect(result).not.toContain('|opengl notes           = \n\n\n');
    });
});
