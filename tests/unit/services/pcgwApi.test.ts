import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcgwApi } from '../../../src/services/pcgwApi';
import { pcgwAuth } from '../../../src/services/pcgwAuth';

describe('pcgwApi', () => {
    beforeEach(() => {
        pcgwApi.resetCache();
    });

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

    describe('namespace searches', () => {
        it('should search companies using namespace 416 opensearch', async () => {
            const fetchSpy = vi.spyOn(pcgwApi as any, 'fetchApi').mockResolvedValue([
                'Valve',
                ['Company:Valve', 'Company:Valve Corporation'],
                ['', ''],
                ['https://www.pcgamingwiki.com/wiki/Company:Valve', 'https://www.pcgamingwiki.com/wiki/Company:Valve_Corporation']
            ]);

            const results = await pcgwApi.searchCompanies('Valve');
            expect(fetchSpy).toHaveBeenCalledWith({
                action: 'opensearch',
                search: 'Valve',
                namespace: '416',
                limit: '10'
            });
            expect(results).toEqual(['Valve', 'Valve Corporation']);
            fetchSpy.mockRestore();
        });

        it('should search engines using namespace 404 opensearch', async () => {
            const fetchSpy = vi.spyOn(pcgwApi as any, 'fetchApi').mockResolvedValue([
                'Unreal',
                ['Engine:Unreal Engine', 'Engine:Unreal Engine 5'],
                ['', ''],
                ['https://www.pcgamingwiki.com/wiki/Engine:Unreal_Engine', 'https://www.pcgamingwiki.com/wiki/Engine:Unreal_Engine_5']
            ]);

            const results = await pcgwApi.searchEngines('Unreal');
            expect(fetchSpy).toHaveBeenCalledWith({
                action: 'opensearch',
                search: 'Unreal',
                namespace: '404',
                limit: '10'
            });
            expect(results).toEqual(['Unreal Engine', 'Unreal Engine 5']);
            fetchSpy.mockRestore();
        });

        it('should search series using namespace 402 opensearch', async () => {
            const fetchSpy = vi.spyOn(pcgwApi as any, 'fetchApi').mockResolvedValue([
                'Half-Life',
                ['Series:Half-Life'],
                [''],
                ['https://www.pcgamingwiki.com/wiki/Series:Half-Life']
            ]);

            const results = await pcgwApi.searchSeries('Half-Life');
            expect(fetchSpy).toHaveBeenCalledWith({
                action: 'opensearch',
                search: 'Half-Life',
                namespace: '402',
                limit: '10'
            });
            expect(results).toEqual(['Half-Life']);
            fetchSpy.mockRestore();
        });
    });

    describe('prewarmCargoInitialValues', () => {
        it('should fetch all taxonomy fields in a single query when logged in', async () => {
            vi.spyOn(pcgwAuth, 'isLoggedIn', 'get').mockReturnValue(true);

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

            await pcgwApi.prewarmCargoInitialValues();

            expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({
                action: 'cargoquery',
                tables: 'Game',
                order_by: 'Game._pageID DESC'
            }), true);

            // Verify cached values by calling the public methods
            fetchSpy.mockClear();

            const genres = await pcgwApi.searchGenres();
            expect(genres).toEqual(['First-person shooter']);

            expect(fetchSpy).not.toHaveBeenCalled();

            fetchSpy.mockRestore();
            vi.restoreAllMocks();
        });

        it('should do nothing and return empty when not logged in', async () => {
            vi.spyOn(pcgwAuth, 'isLoggedIn', 'get').mockReturnValue(false);
            const fetchSpy = vi.spyOn(pcgwApi as any, 'fetchApi');

            await pcgwApi.prewarmCargoInitialValues();

            expect(fetchSpy).not.toHaveBeenCalled();

            const genres = await pcgwApi.searchGenres();
            expect(genres).toEqual([]);

            vi.restoreAllMocks();
        });
    });
});

