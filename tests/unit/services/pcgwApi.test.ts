import { describe, it, expect, vi } from 'vitest';
import { pcgwApi } from '../../../src/services/pcgwApi';

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

    describe('getLatestRevisionsInfo', () => {
        it('should fetch revision info for multiple pages in one query', async () => {
            const fetchSpy = vi.spyOn(pcgwApi as any, 'fetchApi').mockResolvedValue({
                query: {
                    pages: {
                        '123': { title: 'Game 1', revisions: [{ revid: 150 }] },
                        '456': { title: 'Game 2 Redirect', revisions: [{ revid: 250 }] }
                    },
                    normalized: [
                        { from: 'game_1', to: 'Game 1' }
                    ],
                    redirects: [
                        { from: 'Game 2', to: 'Game 2 Redirect' }
                    ]
                }
            });

            const results = await pcgwApi.getLatestRevisionsInfo(['game_1', 'Game 2']);
            
            expect(fetchSpy).toHaveBeenCalledWith({
                action: 'query',
                prop: 'revisions',
                titles: 'game_1|Game 2',
                rvprop: 'ids',
                redirects: '1'
            });

            expect(results).toEqual({
                'game_1': { revid: 150 },
                'Game 2': { revid: 250 }
            });

            fetchSpy.mockRestore();
        });
    });

    describe('prewarmCargoInitialValues', () => {
        it('should fetch all taxonomy fields in a single query and cache them correctly', async () => {
            const fetchSpy = vi.spyOn(pcgwApi as any, 'fetchApi').mockResolvedValue({
                cargoquery: [
                    {
                        title: {
                            Developers: 'Valve, Gearbox Software',
                            Publishers: 'Valve, Sierra Entertainment',
                            Engines: 'Source, GoldSrc',
                            Series: 'Half-Life',
                            Genres: 'First-person shooter',
                            Themes: 'Sci-fi',
                            Perspectives: 'First-person',
                            Pacing: 'Real-time',
                            Controls: 'Keyboard and mouse',
                            Sports: '',
                            Vehicles: '',
                            'Art styles': 'Realistic',
                            Monetization: 'One-time game purchase',
                            Microtransactions: 'None',
                            Modes: 'Single-player, Multiplayer'
                        }
                    }
                ]
            });

            // Make sure cache is clean before test
            pcgwApi.resetCache();

            await pcgwApi.prewarmCargoInitialValues();

            expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({
                action: 'cargoquery',
                tables: 'Infobox_game',
                order_by: 'Infobox_game._pageID DESC'
            }));

            // Verify cached values by calling the public methods
            fetchSpy.mockClear();

            const genres = await pcgwApi.searchGenres();
            expect(genres).toEqual(['First-person shooter']);

            const companies = await pcgwApi.searchCompanies();
            expect(companies).toContain('Valve');
            expect(companies).toContain('Gearbox Software');
            expect(companies).toContain('Sierra Entertainment');

            // Verify a common search cache was warmed
            const devSearch = await pcgwApi.searchCompanies('Valve');
            expect(devSearch).toEqual(['Valve']);

            expect(fetchSpy).not.toHaveBeenCalled();

            fetchSpy.mockRestore();
        });
    });
});

