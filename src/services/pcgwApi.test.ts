import { describe, it, expect } from 'vitest';
import { pcgwApi } from './pcgwApi';

describe('pcgwApi', () => {
    describe('extractTitleFromUrl', () => {
        it('should extract title from standard wiki path', () => {
            const url = 'https://www.pcgamingwiki.com/wiki/Grand_Theft_Auto_V';
            expect(pcgwApi.extractTitleFromUrl(url)).toBe('Grand Theft Auto V');
        });

        it('should extract title from subpage path', () => {
            const url = 'https://www.pcgamingwiki.com/wiki/User:Maicol07/Test';
            expect(pcgwApi.extractTitleFromUrl(url)).toBe('User:Maicol07/Test');
        });

        it('should extract title with special characters', () => {
            const url = 'https://www.pcgamingwiki.com/wiki/S.T.A.L.K.E.R.:_Shadow_of_Chernobyl';
            expect(pcgwApi.extractTitleFromUrl(url)).toBe('S.T.A.L.K.E.R.: Shadow of Chernobyl');
        });

        it('should extract title from index.php with title parameter', () => {
            const url = 'https://www.pcgamingwiki.com/w/index.php?title=User:Maicol07/Test&action=edit';
            expect(pcgwApi.extractTitleFromUrl(url)).toBe('User:Maicol07/Test');
        });

        it('should return null for non-PCGW URLs', () => {
            const url = 'https://en.wikipedia.org/wiki/Grand_Theft_Auto_V';
            expect(pcgwApi.extractTitleFromUrl(url)).toBeNull();
        });

        it('should handle URLs with trailing slashes gracefully by ignoring them', () => {
            const url = 'https://www.pcgamingwiki.com/wiki/User:Maicol07/Test/';
            expect(pcgwApi.extractTitleFromUrl(url)).toBe('User:Maicol07/Test');
        });
    });
});
