import { describe, it, expect } from 'vitest';
import { parseWikitext } from './parser';

describe('Parser - Nested Wikitext Preservation', () => {
    it('should preserve nested templates in parameter values', () => {
        const wikitext = `
{{Video
|widescreen resolution notes= 7 different resolutions selectable in-game, but they do not seem to work as intended{{cn|date=2023-09-16|reason=}}. 16:10 aspect ratios are labelled "1280x800 Steam Deck" and "3840x2160" (usually a 16:9 resolution). Other options use letterboxing.
}}`;

        const data = parseWikitext(wikitext);

        // Should preserve the {{cn|...}} template
        expect(data.video.widescreenResolutionNotes).toContain('{{cn|date=2023-09-16|reason=}}');
        // Should not strip it to plain text
        expect(data.video.widescreenResolutionNotes).not.toMatch(/cndate2023-09-16reason/);
        // Should keep the full text
        expect(data.video.widescreenResolutionNotes).toContain('7 different resolutions selectable in-game');
    });

    it('should handle multiple nested templates in a value', () => {
        const wikitext = `
{{Input
|key remap notes= Supports rebinding{{cn|date=2024-01-01|reason=needs verification}} and has profiles{{ref|url=example.com|text=Source}}.
}}`;

        const data = parseWikitext(wikitext);

        expect(data.input.keyRemapNotes).toContain('{{cn|date=2024-01-01|reason=needs verification}}');
        expect(data.input.keyRemapNotes).toContain('{{ref|url=example.com|text=Source}}');
    });
});

describe('Parser - System Requirements', () => {
    it('should parse system requirements using OSfamily to detect OS', () => {
        // This is the actual format used in PCGW
        const wikitext = `
{{System requirements
|OSfamily = Windows

|minOS    = 7
|minCPU   = Intel Core i5-6600
|minCPU2  = AMD Ryzen 5 1600
|minRAM   = 8 GB
|minHD    = 
|minGPU   = Nvidia GeForce GTX 960

|recOS    = 10
|recCPU   = Intel Core i7-6700K
|recCPU2  = AMD Ryzen 7
|recRAM   = 16 GB
|recHD    = 
|recGPU   = Nvidia GeForce GTX 1050
|notes    = 
}}`;

        const data = parseWikitext(wikitext);

        expect(data.requirements.windows.minimum.os).toBe('7');
        expect(data.requirements.windows.minimum.cpu).toBe('Intel Core i5-6600');
        expect(data.requirements.windows.minimum.ram).toBe('8 GB');
        expect(data.requirements.windows.minimum.gpu).toBe('Nvidia GeForce GTX 960');

        expect(data.requirements.windows.recommended.os).toBe('10');
        expect(data.requirements.windows.recommended.cpu).toBe('Intel Core i7-6700K');
        expect(data.requirements.windows.recommended.ram).toBe('16 GB');
        expect(data.requirements.windows.recommended.gpu).toBe('Nvidia GeForce GTX 1050');
    });

    it('should parse existing system requirements with OS parameter', () => {
        const wikitext = `
{{System requirements
|OS=Windows
|minOS=Windows 10
|minCPU=Intel Core i5
|minRAM=8 GB
|minHD=50 GB
|minGPU=NVIDIA GTX 1060
|recOS=Windows 10
|recCPU=Intel Core i7
|recRAM=16 GB
|recHD=50 GB
|recGPU=NVIDIA RTX 3070
|notes=SSD recommended
}}`;

        const data = parseWikitext(wikitext);

        expect(data.requirements.windows.minimum.os).toBe('Windows 10');
        expect(data.requirements.windows.minimum.cpu).toBe('Intel Core i5');
        expect(data.requirements.windows.minimum.ram).toBe('8 GB');
        expect(data.requirements.windows.minimum.hdd).toBe('50 GB');
        expect(data.requirements.windows.minimum.gpu).toBe('NVIDIA GTX 1060');

        expect(data.requirements.windows.recommended.os).toBe('Windows 10');
        expect(data.requirements.windows.recommended.cpu).toBe('Intel Core i7');
        expect(data.requirements.windows.recommended.ram).toBe('16 GB');
        expect(data.requirements.windows.recommended.gpu).toBe('NVIDIA RTX 3070');

        expect(data.requirements.windows.notes).toBe('SSD recommended');
    });

    it('should leave system requirements empty when template does not exist', () => {
        const wikitext = `
{{Video
|widescreen resolution = true
}}`;

        const data = parseWikitext(wikitext);

        // When no System requirements template exists, all fields should be empty
        expect(data.requirements.windows.minimum.os).toBe('');
        expect(data.requirements.mac.minimum.os).toBe('');
        expect(data.requirements.linux.minimum.os).toBe('');
    });

    it('should handle multiple OS requirements', () => {
        const wikitext = `
{{System requirements
|OS=Windows
|minCPU=Intel i5
}}

{{System requirements
|OS=Mac OS X
|minCPU=Apple M1
}}

{{System requirements
|OS=Linux
|minCPU=AMD Ryzen 5
}}`;

        const data = parseWikitext(wikitext);

        expect(data.requirements.windows.minimum.cpu).toBe('Intel i5');
        expect(data.requirements.mac.minimum.cpu).toBe('Apple M1');
        expect(data.requirements.linux.minimum.cpu).toBe('AMD Ryzen 5');
    });
});
