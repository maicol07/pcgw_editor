
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../../../src/utils/parser';
import { PCGWEditor } from '../../../src/utils/wikitext';
import { GameData, SystemRequirements } from '../../../src/models/GameData';

describe('Field Group: System Requirements', () => {
    describe('System Requirements', () => {
        const createEmptyReqs = (): SystemRequirements => ({
            windows: { minimum: {} as any, recommended: {} as any },
            mac: { minimum: {} as any, recommended: {} as any },
            linux: { minimum: {} as any, recommended: {} as any }
        });

        interface SysReqTestCase {
            desc: string;
            templateArgs: Record<string, string>;
            expectedPath: string; // e.g., 'windows.minimum.cpu'
            expectedValue: string;
            extraData?: Record<string, string>;
        }

        const testCases: SysReqTestCase[] = [
            // Windows Minimum
            { desc: 'Windows Min CPU', templateArgs: { OSfamily: 'Windows', minCPU: 'Intel Core i5' }, expectedPath: 'windows.minimum.cpu', expectedValue: 'Intel Core i5' },
            { desc: 'Windows Min GPU', templateArgs: { OSfamily: 'Windows', minGPU: 'NVIDIA RTX 3060' }, expectedPath: 'windows.minimum.gpu', expectedValue: 'NVIDIA RTX 3060' },
            { desc: 'Windows Min RAM', templateArgs: { OSfamily: 'Windows', minRAM: '8 GB' }, expectedPath: 'windows.minimum.ram', expectedValue: '8 GB' },
            { desc: 'Windows Min HD', templateArgs: { OSfamily: 'Windows', minHD: '50 GB' }, expectedPath: 'windows.minimum.hdd', expectedValue: '50 GB' },

            // Windows Recommended
            { desc: 'Windows Rec CPU', templateArgs: { OSfamily: 'Windows', recCPU: 'Intel Core i9' }, expectedPath: 'windows.recommended.cpu', expectedValue: 'Intel Core i9' },
            { desc: 'Windows Rec GPU', templateArgs: { OSfamily: 'Windows', recGPU: 'NVIDIA RTX 4090' }, expectedPath: 'windows.recommended.gpu', expectedValue: 'NVIDIA RTX 4090' },

            // Mac
            { desc: 'Mac Min OS', templateArgs: { OSfamily: 'Mac', minOS: 'macOS 12' }, expectedPath: 'mac.minimum.os', expectedValue: 'macOS 12' },
            { desc: 'Mac Rec RAM', templateArgs: { OSfamily: 'Mac', recRAM: '16 GB' }, expectedPath: 'mac.recommended.ram', expectedValue: '16 GB' },

            // Linux
            { desc: 'Linux Min HD', templateArgs: { OSfamily: 'Linux', minHD: '50 GB' }, expectedPath: 'linux.minimum.hdd', expectedValue: '50 GB' },
            { desc: 'Linux Rec DX', templateArgs: { OSfamily: 'Linux', recDX: 'VKD3D' }, expectedPath: 'linux.recommended.dx', expectedValue: 'VKD3D' },

            // Extended Fields
            { desc: 'Extended CPU2', templateArgs: { OSfamily: 'Windows', minCPU2: 'Ryzen 5' }, expectedPath: 'windows.minimum.cpu2', expectedValue: 'Ryzen 5' },
            { desc: 'Extended GPU3', templateArgs: { OSfamily: 'Windows', minGPU3: 'Intel Arc A770' }, expectedPath: 'windows.minimum.gpu3', expectedValue: 'Intel Arc A770' },
            { desc: 'Extended VRAM', templateArgs: { OSfamily: 'Windows', minVRAM: '8 GB' }, expectedPath: 'windows.minimum.vram', expectedValue: '8 GB' },
            { desc: 'Extended OGL', templateArgs: { OSfamily: 'Windows', minOGL: '4.6' }, expectedPath: 'windows.minimum.ogl', expectedValue: '4.6' },
            { desc: 'Extended DX', templateArgs: { OSfamily: 'Windows', minDX: '12' }, expectedPath: 'windows.minimum.dx', expectedValue: '12' },
            { desc: 'Extended Others', templateArgs: { OSfamily: 'Windows', minother: 'Other Notes' }, expectedPath: 'windows.minimum.other', expectedValue: 'Other Notes' },

            // Alternative Requirements
            { desc: 'Alt1 Title', templateArgs: { OSfamily: 'Windows', alt1Title: 'Toaster Mode' }, expectedPath: 'windows.alt1.title', expectedValue: 'Toaster Mode' },
            { desc: 'Alt1 CPU', templateArgs: { OSfamily: 'Windows', alt1Title: 'Toaster Mode', alt1CPU: 'Pentium 4' }, expectedPath: 'windows.alt1.cpu', expectedValue: 'Pentium 4', extraData: { 'windows.alt1.title': 'Toaster Mode' } },
            { desc: 'Alt2 Title', templateArgs: { OSfamily: 'Windows', alt2Title: 'NASA PC' }, expectedPath: 'windows.alt2.title', expectedValue: 'NASA PC' },
            { desc: 'Alt2 RAM', templateArgs: { OSfamily: 'Windows', alt2Title: 'NASA PC', alt2RAM: '1 TB' }, expectedPath: 'windows.alt2.ram', expectedValue: '1 TB', extraData: { 'windows.alt2.title': 'NASA PC' } }
        ];

        const accessData = (path: string, obj: any) => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        const setData = (path: string, obj: any, val: any) => {
            const parts = path.split('.');
            let current = obj;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = val;
        };

        describe('Parsing', () => {
            it.each(testCases)('should parse $desc', ({ templateArgs, expectedPath, expectedValue }) => {
                let wikitext = '{{System requirements\n';
                for (const [key, val] of Object.entries(templateArgs)) {
                    wikitext += `|${key} = ${val}\n`;
                }
                wikitext += '}}';

                const data = parseWikitext(wikitext);
                expect(accessData(`requirements.${expectedPath}`, data)).toBe(expectedValue);
            });
        });

        describe('Writing', () => {
            it.each(testCases)('should write $desc', ({ templateArgs, expectedPath, expectedValue, extraData }) => {
                const data = { requirements: createEmptyReqs() };
                setData(`requirements.${expectedPath}`, data, expectedValue);

                if (extraData) {
                    for (const [path, val] of Object.entries(extraData)) {
                        setData(`requirements.${path}`, data, val);
                    }
                }

                const editor = new PCGWEditor(`{{System requirements\n|OSfamily = ${templateArgs.OSfamily}\n}}`);
                editor.updateSystemRequirements(data.requirements);
                const output = editor.getText();

                // Check for the field key and value in the output
                // Exclude OSfamily from check as it's in the base template
                for (const [key, val] of Object.entries(templateArgs)) {
                    if (key !== 'OSfamily') {
                        // Regex to match |key = value, handling whitespace
                        const regex = new RegExp(`\\|${key}\\s*=\\s*${val.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`);
                        expect(output).toMatch(regex);
                    }
                }
            });
        });
    });
});
