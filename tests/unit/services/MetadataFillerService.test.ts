import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { metadataFillerService } from '../../../src/services/MetadataFillerService';

describe('MetadataFillerService', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        localStorage.clear();
        (metadataFillerService as any).twitchToken = null;
        (metadataFillerService as any).twitchTokenExpiry = 0;
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('hasTwitchCredentials', () => {
        it('should return true if both client ID and secret are present', () => {
            expect(metadataFillerService.hasTwitchCredentials('id', 'secret')).toBe(true);
        });

        it('should return false if either or both are empty', () => {
            expect(metadataFillerService.hasTwitchCredentials('', 'secret')).toBe(false);
            expect(metadataFillerService.hasTwitchCredentials('id', '')).toBe(false);
            expect(metadataFillerService.hasTwitchCredentials('', '')).toBe(false);
        });
    });

    describe('searchIGDB', () => {
        it('should authenticate and return search candidates', async () => {
            const mockFetch = vi.fn()
                // First call: token endpoint
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'mock-token', expires_in: 3600 })
                })
                // Second call: search endpoint
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            id: 101,
                            name: 'Doom',
                            slug: 'doom',
                            first_release_date: 755222400,
                            rating: 92.5,
                            cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/co123.jpg' }
                        }
                    ]
                });
            vi.stubGlobal('fetch', mockFetch);

            const results = await metadataFillerService.searchIGDB('Doom', 'client-id', 'client-secret');

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                id: 101,
                name: 'Doom',
                slug: 'doom',
                releaseYear: 1993,
                rating: 93,
                coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co123.jpg'
            });
            expect(localStorage.getItem('twitch_access_token')).toBe('mock-token');
        });
    });

    describe('fetchIGDBGameDetails', () => {
        it('should fetch game details, websites, and external links, mapping them correctly', async () => {
            const mockFetch = vi.fn()
                // Auth token cached in localStorage from previous test / setup mock
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'mock-token', expires_in: 3600 })
                })
                // Game details response
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            id: 202,
                            name: 'Half-Life 2',
                            slug: 'half-life-2',
                            aggregated_rating: 95.8,
                            websites: [
                                { category: 1, url: 'https://www.half-life.com' },
                                { category: 3, url: 'https://en.wikipedia.org/wiki/Half-Life_2' },
                                { category: 13, url: 'https://store.steampowered.com/app/220/' }
                            ],
                            external_games: [
                                { external_game_source: 1, uid: '220', url: 'https://store.steampowered.com/app/220/' },
                                { external_game_source: 5, uid: 'half_life_2', url: 'https://www.gog.com/game/half_life_2' },
                                { external_game_source: 11, uid: 'half-life-2', url: 'https://store.epicgames.com/en-US/p/half-life-2' },
                                { external_game_source: 36, uid: '123', url: 'https://opencritic.com/game/123/half-life-2' }
                            ]
                        }
                    ]
                })
                // Steam AppDetails fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        '220': {
                            success: true,
                            data: {
                                metacritic: {
                                    score: 96,
                                    url: 'https://www.metacritic.com/game/pc/half-life-2'
                                }
                            }
                        }
                    })
                });

            vi.stubGlobal('fetch', mockFetch);

            const details = await metadataFillerService.fetchIGDBGameDetails(202, 'client-id', 'client-secret');

            expect(details).not.toBeNull();
            expect(details!.igdb).toBe('half-life-2');
            expect(details!.igdbScore).toBe('96'); // rounded 95.8
            expect(details!.officialSite).toBe('https://www.half-life.com');
            expect(details!.wikipedia).toBe('Half-Life 2');
            expect(details!.steamAppId).toBe('220');
            expect(details!.gogComId).toBe('half_life_2');
            expect(details!.epic).toBe('p/half-life-2');
            expect(details!.metacriticScore).toBe('96');
            expect(details!.metacriticId).toBe('game/pc/half-life-2');
        });

        it('should extract Metacritic ID from websites or external games if present', async () => {
            const mockFetch = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'mock-token', expires_in: 3600 })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => [
                        {
                            id: 205,
                            name: 'Test Game',
                            slug: 'test-game',
                            websites: [
                                { category: 20, url: 'https://www.metacritic.com/game/pc/test-game' }
                            ]
                        }
                    ]
                });

            vi.stubGlobal('fetch', mockFetch);

            const details = await metadataFillerService.fetchIGDBGameDetails(205, 'client-id', 'client-secret');
            expect(details).not.toBeNull();
            expect(details!.metacriticId).toBe('game/pc/test-game');
        });
    });

    describe('searchGeneralStoreFallback', () => {
        it('should fall back to Steam search and app details when Twitch API is missing', async () => {
            const mockFetch = vi.fn()
                // Steam store search response
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        total: 1,
                        items: [
                            { id: 220, name: 'Half-Life 2' }
                        ]
                    })
                })
                // Steam AppDetails response
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        '220': {
                            success: true,
                            data: {
                                metacritic: {
                                    score: 96,
                                    url: 'https://www.metacritic.com/game/pc/half-life-2'
                                },
                                website: 'https://www.half-life.com'
                            }
                        }
                    })
                });

            vi.stubGlobal('fetch', mockFetch);

            const details = await metadataFillerService.searchGeneralStoreFallback('Half-Life 2');

            expect(details).not.toBeNull();
            expect(details!.steamAppId).toBe('220');
            expect(details!.metacriticScore).toBe('96');
            expect(details!.metacriticId).toBe('game/pc/half-life-2');
            expect(details!.officialSite).toBe('https://www.half-life.com');
        });
    });

    describe('searchRAWG', () => {
        it('should perform a search on RAWG and return candidates', async () => {
            const mockFetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [
                        {
                            id: 501,
                            name: 'Portal 2',
                            slug: 'portal-2',
                            released: '2011-04-18',
                            background_image: 'https://media.rawg.io/media/games/portal-2.jpg'
                        }
                    ]
                })
            });
            vi.stubGlobal('fetch', mockFetch);

            const results = await metadataFillerService.searchRAWG('Portal 2', 'rawg-key');
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Portal 2');
            expect(results[0].releaseYear).toBe(2011);
            expect(results[0].coverUrl).toBe('https://media.rawg.io/media/games/portal-2.jpg');
        });
    });

    describe('fetchRAWGGameDetails', () => {
        it('should retrieve detailed metadata from RAWG', async () => {
            const mockFetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    metacritic: 95,
                    website: 'https://www.thinkwithportals.com',
                    stores: [
                        {
                            store: { slug: 'steam' },
                            url: 'https://store.steampowered.com/app/620'
                        }
                    ]
                })
            });
            vi.stubGlobal('fetch', mockFetch);

            const details = await metadataFillerService.fetchRAWGGameDetails(501, 'rawg-key');
            expect(details).not.toBeNull();
            expect(details!.metacriticScore).toBe('95');
            expect(details!.officialSite).toBe('https://www.thinkwithportals.com');
            expect(details!.steamAppId).toBe('620');
        });
    });



    describe('fetchVNDBMetadata', () => {
        it('should query VNDB API and return vndb ID', async () => {
            const mockFetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [
                        {
                            id: 'v9999',
                            title: 'Visual Novel'
                        }
                    ]
                })
            });
            vi.stubGlobal('fetch', mockFetch);

            const details = await metadataFillerService.fetchVNDBMetadata('Visual Novel');
            expect(details).not.toBeNull();
            expect(details!.vndb).toBe('v9999');
        });
    });
});
