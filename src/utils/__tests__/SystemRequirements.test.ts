
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../parser';
import { PCGWEditor } from '../wikitext';
import { initialGameData } from '../../models/GameData';

describe('System Requirements', () => {

    // --- Parsing Tests ---

    it('should parse Windows system requirements correctly', () => {
        const wikitext = `
{{System requirements
|OSfamily = Windows
|minOS    = Windows 10
|minCPU   = Intel Core i5
|minRAM   = 8 GB
|minHD    = 50 GB
|minGPU   = NVIDIA GTX 1060
|recOS    = Windows 11
|recCPU   = Intel Core i7
|recRAM   = 16 GB
|recHD    = 100 GB SSD
|recGPU   = NVIDIA RTX 3060
|notes    = Requires 64-bit processor
}}`;
        const data = parseWikitext(wikitext);

        expect(data.requirements.windows).toBeDefined();

        // Minimum
        expect(data.requirements.windows.minimum.os).toBe('Windows 10');
        expect(data.requirements.windows.minimum.cpu).toBe('Intel Core i5');
        expect(data.requirements.windows.minimum.ram).toBe('8 GB');
        expect(data.requirements.windows.minimum.hdd).toBe('50 GB');
        expect(data.requirements.windows.minimum.gpu).toBe('NVIDIA GTX 1060');

        // Recommended
        expect(data.requirements.windows.recommended.os).toBe('Windows 11');
        expect(data.requirements.windows.recommended.cpu).toBe('Intel Core i7');
        expect(data.requirements.windows.recommended.ram).toBe('16 GB');
        expect(data.requirements.windows.recommended.hdd).toBe('100 GB SSD');
        expect(data.requirements.windows.recommended.gpu).toBe('NVIDIA RTX 3060');

        expect(data.requirements.windows.notes).toBe('Requires 64-bit processor');
    });

    it('should parse Mac and Linux requirements correctly', () => {
        const wikitext = `
{{System requirements
|OSfamily = Mac
|minOS    = macOS 12
|minCPU   = M1
|minRAM   = 8 GB
|minHD    = 20 GB
|minGPU   = Apple Silicon
}}
{{System requirements
|OSfamily = Linux
|minOS    = Ubuntu 20.04
|minCPU   = Ryzen 5
|minRAM   = 16 GB
|minHD    = 30 GB
|minGPU   = AMD Radeon RX 580
}}`;
        const data = parseWikitext(wikitext);

        // Mac
        expect(data.requirements.mac.minimum.os).toBe('macOS 12');
        expect(data.requirements.mac.minimum.cpu).toBe('M1');
        expect(data.requirements.mac.minimum.gpu).toBe('Apple Silicon');

        // Linux
        expect(data.requirements.linux.minimum.os).toBe('Ubuntu 20.04');
        expect(data.requirements.linux.minimum.cpu).toBe('Ryzen 5');
        expect(data.requirements.linux.minimum.ram).toBe('16 GB');
    });

    it('should fallback to OSfamily if OS param is missing', () => {
        const wikitext = `
{{System requirements
|OSfamily = Linux
|minOS    = Fedora
}}`;
        const data = parseWikitext(wikitext);
        expect(data.requirements.linux.minimum.os).toBe('Fedora');
    });

    // --- Writing Tests ---

    it('should update existing Windows requirements correctly', () => {
        const originalWikitext = `
{{System requirements
|OSfamily = Windows
|minOS    = Windows 7
|minCPU   = Dual Core
|minRAM   = 4 GB
}}`;

        const editor = new PCGWEditor(originalWikitext);
        const data = parseWikitext(originalWikitext);

        // Update data
        data.requirements.windows.minimum.os = 'Windows 10';
        data.requirements.windows.minimum.ram = '8 GB';
        data.requirements.windows.recommended.cpu = 'Quad Core';
        data.requirements.windows.notes = 'Updated notes';

        // Write back
        editor.updateSystemRequirements(data.requirements);
        const newWikitext = editor.getText();

        expect(newWikitext).toContain('|minOS    = Windows 10'); // Parser/Writer typically preserves alignment if using replaceParameterContent, but updateSystemRequirements uses setParameter which might not perfectly align unless handled? 
        // Wait, setParameter in wikiparser-node usually handles key=value replacement. 
        // Let's inspect the output robustly

        expect(newWikitext).toMatch(/\|\s*minOS\s*=\s*Windows 10/);
        expect(newWikitext).toMatch(/\|\s*minRAM\s*=\s*8 GB/);

        // It creates new params if they didn't exist
        expect(newWikitext).toMatch(/\|\s*recCPU\s*=\s*Quad Core/);
        expect(newWikitext).toMatch(/\|\s*notes\s*=\s*Updated notes/);

        // Should preserve OS=Windows
        expect(newWikitext).toMatch(/\|\s*OSfamily\s*=\s*Windows/);
    });

    it('should handle updating multiple OS blocks independently', () => {
        const originalWikitext = `
{{System requirements | OSfamily = Windows | minOS = 7 }}
{{System requirements | OSfamily = Linux | minOS = Ubuntu }}
`;
        const editor = new PCGWEditor(originalWikitext);
        const data = JSON.parse(JSON.stringify(initialGameData));

        data.requirements.windows.minimum.os = 'Windows 11';
        data.requirements.linux.minimum.os = 'Arch'; // BTW

        editor.updateSystemRequirements(data.requirements);
        const newWikitext = editor.getText();

        expect(newWikitext).toMatch(/\|\s*OSfamily\s*=\s*Windows[\s\S]*\|\s*minOS\s*=\s*Windows 11/);
        expect(newWikitext).toMatch(/\|\s*OSfamily\s*=\s*Linux[\s\S]*\|\s*minOS\s*=\s*Arch/);
    });

    it('should create System Requirements section if it does not exist', () => {
        const originalWikitext = `No specs here`;
        const editor = new PCGWEditor(originalWikitext);
        const data = JSON.parse(JSON.stringify(initialGameData));
        data.requirements.windows.minimum.os = 'Windows 10';

        editor.updateSystemRequirements(data.requirements);
        const newWikitext = editor.getText();

        expect(newWikitext).toContain('== System requirements ==');
        expect(newWikitext).toContain('|minOS    = Windows 10');
    });

});
