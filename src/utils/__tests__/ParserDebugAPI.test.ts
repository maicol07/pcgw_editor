
import { describe, it, expect } from 'vitest';
import { parseWikitext } from '../parser';

describe('Parser Debug API', () => {
    it('should parse API fields correctly from wikitext', () => {
        const wikitext = `
{{Infobox game
|cover=Test.jpg
}}

{{API
|direct3d versions      = 11, 12
|direct3d notes         = dx notes
|directdraw versions    = 7
|directdraw notes       = dd notes
|opengl versions        = 4.5
|opengl notes           = gl notes
|vulkan versions        = 1.3
|vulkan notes           = vk notes
|glide versions         = 3dfx
|glide notes            = glide notes
|dos modes              = true
|dos modes notes        = dos notes
|windows 32-bit exe     = true
|windows 64-bit exe     = true
|windows arm app        = true
|windows exe notes      = win notes
|mac os x powerpc app   = true
|macos intel 32-bit app = true
|macos intel 64-bit app = true
|macos arm app          = true
|mac os 68k app         = true
|mac os powerpc app     = true
|mac os executable notes= mac notes
|macos app notes        = mac app notes
|linux 32-bit executable= true
|linux 64-bit executable= true
|linux arm app          = true
|linux powerpc app      = true
|linux 68k app          = true
|linux executable notes = linux notes
}}
`;
        const data = parseWikitext(wikitext);

        expect(data.api.dxVersion).toBe('11, 12');
        expect(data.api.directDrawVersion).toBe('7');
        expect(data.api.openGlVersion).toBe('4.5');
        expect(data.api.vulkanVersion).toBe('1.3');
        expect(data.api.glideVersion).toBe('3dfx');

        expect(data.api.windows32).toBe('true');
        expect(data.api.windows64).toBe('true');
        expect(data.api.linux32).toBe('true');
        expect(data.api.macOsArm).toBe('true');
        expect(data.api.macOsNotes).toBe('mac notes');
    });
});
