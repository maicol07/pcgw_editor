import { GeminiService } from './GeminiService';

export interface ExtractedMetadata {
    steamAppId?: string;
    gogComId?: string;
    epic?: string;
    microsoft?: string;
    itch?: string;
    zoom?: string;
    officialSite?: string;
    hltb?: string;
    igdb?: string;
    mobygames?: string;
    wikipedia?: string;
    vndb?: string;
    lutris?: string;
    wineHq?: string;
    metacriticScore?: string;
    metacriticId?: string;
    opencriticScore?: string;
    opencriticId?: string;
    igdbScore?: string;
}

export interface IGDBGameCandidate {
    id: number;
    name: string;
    slug: string;
    coverUrl?: string;
    releaseYear?: number;
    rating?: number;
    source?: string;
}

interface IGDBWebsite {
    category: number;
    url: string;
}

interface IGDBExternalGame {
    category: number;
    uid: string;
    url: string;
    external_game_source?: number | { id: number; name: string };
}

interface IGDBGame {
    id: number;
    name: string;
    slug: string;
    aggregated_rating?: number;
    rating?: number;
    first_release_date?: number;
    cover?: { url: string };
    websites?: IGDBWebsite[];
    external_games?: IGDBExternalGame[];
}

class MetadataFillerService {
    private twitchToken: string | null = null;
    private twitchTokenExpiry = 0;

    /**
     * Checks if Twitch/IGDB credentials are set
     */
    hasTwitchCredentials(clientId: string, clientSecret: string): boolean {
        return !!(clientId && clientSecret);
    }

    /**
     * Searches for games on RAWG.io
     */
    async searchRAWG(query: string, apiKey: string): Promise<IGDBGameCandidate[]> {
        if (!apiKey) return [];
        try {
            const url = `https://corsproxy.io/?${encodeURIComponent(
                `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=10`
            )}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`RAWG search failed: ${response.statusText}`);
            
            const data = await response.json();
            if (!data.results) return [];
            
            return data.results.map((game: any) => {
                const releaseYear = game.released ? new Date(game.released).getFullYear() : undefined;
                return {
                    id: game.id,
                    name: game.name,
                    slug: game.slug,
                    coverUrl: game.background_image || undefined,
                    releaseYear
                };
            });
        } catch (error) {
            console.error('RAWG search error:', error);
            return [];
        }
    }

    /**
     * Fetches detailed metadata from RAWG.io
     */
    async fetchRAWGGameDetails(gameId: number, apiKey: string): Promise<ExtractedMetadata | null> {
        if (!apiKey) return null;
        try {
            const url = `https://corsproxy.io/?${encodeURIComponent(
                `https://api.rawg.io/api/games/${gameId}?key=${apiKey}`
            )}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`RAWG fetch details failed: ${response.statusText}`);
            
            const game = await response.json();
            const metadata: ExtractedMetadata = {};
            
            if (game.metacritic) {
                metadata.metacriticScore = game.metacritic.toString();
            }
            if (game.website) {
                metadata.officialSite = game.website;
            }
            
            // Parse store links
            if (game.stores) {
                for (const item of game.stores) {
                    const storeSlug = item.store?.slug;
                    const storeUrl = item.url;
                    if (!storeUrl) continue;
                    
                    if (storeSlug === 'steam') {
                        const match = storeUrl.match(/store\.steampowered\.com\/app\/(\d+)/);
                        if (match) metadata.steamAppId = match[1];
                    } else if (storeSlug === 'gog') {
                        const match = storeUrl.match(/gog\.com\/(?:[a-zA-Z-]+\/)?game\/([a-zA-Z0-9_-]+)/);
                        if (match) metadata.gogComId = match[1];
                    } else if (storeSlug === 'epic-games') {
                        const match = storeUrl.match(/epicgames\.com\/(?:[a-zA-Z-]+\/)?p\/([a-zA-Z0-9_-]+)/);
                        if (match) metadata.epic = `p/${match[1]}`;
                    } else if (storeSlug === 'itch') {
                        const match = storeUrl.match(/([a-zA-Z0-9_-]+)\.itch\.io\/([a-zA-Z0-9_-]+)/);
                        if (match) {
                            metadata.itch = `${match[1]}/${match[2]}`;
                        } else {
                            const directMatch = storeUrl.match(/https?:\/\/([a-zA-Z0-9_-]+)\.itch\.io\/?/);
                            if (directMatch) metadata.itch = directMatch[1];
                        }
                    } else if (storeSlug === 'xbox-store') {
                        const match = storeUrl.match(/microsoft\.com\/(?:[a-zA-Z-]+\/)?p\/([a-zA-Z0-9_-]+)/);
                        if (match) metadata.microsoft = match[1];
                    }
                }
            }
            
            return metadata;
        } catch (error) {
            console.error('RAWG fetch details error:', error);
            return null;
        }
    }



    /**
     * Searches and fetches visual novel ID from VNDB API
     */
    async fetchVNDBMetadata(gameTitle: string): Promise<ExtractedMetadata | null> {
        try {
            const url = `https://corsproxy.io/?${encodeURIComponent('https://api.vndb.org/kana/vn')}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filters: ['search', '=', gameTitle],
                    fields: 'title,released'
                })
            });
            if (!response.ok) throw new Error(`VNDB search failed: ${response.statusText}`);
            
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const item = data.results[0];
                return {
                    vndb: item.id
                };
            }
        } catch (error) {
            console.error('VNDB fetch error:', error);
        }
        return null;
   }

    /**
     * Acquires a Twitch OAuth2 Access Token, with local storage caching
     */
    private async getTwitchToken(clientId: string, clientSecret: string): Promise<string | null> {
        // Check memory cache
        if (this.twitchToken && Date.now() < this.twitchTokenExpiry) {
            return this.twitchToken;
        }

        // Check local storage cache
        const storedToken = localStorage.getItem('twitch_access_token');
        const storedExpiry = localStorage.getItem('twitch_access_token_expires');
        if (storedToken && storedExpiry) {
            const expiry = parseInt(storedExpiry, 10);
            if (Date.now() < expiry) {
                this.twitchToken = storedToken;
                this.twitchTokenExpiry = expiry;
                return storedToken;
            }
        }

        try {
            // Twitch client-credentials POST via CORS proxy
            // We pass parameters in query string to be safe with corsproxy.io POST behavior
            const tokenUrl = `https://corsproxy.io/?${encodeURIComponent(
                `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
            )}`;
            
            const response = await fetch(tokenUrl, { method: 'POST' });
            if (!response.ok) {
                throw new Error(`Twitch OAuth failed: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.access_token) {
                this.twitchToken = data.access_token;
                this.twitchTokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // 1 minute buffer

                localStorage.setItem('twitch_access_token', data.access_token);
                localStorage.setItem('twitch_access_token_expires', this.twitchTokenExpiry.toString());

                return this.twitchToken;
            }
        } catch (error) {
            console.error('Failed to get Twitch access token:', error);
        }

        return null;
    }

    /**
     * Searches for games on IGDB
     */
    async searchIGDB(query: string, clientId: string, clientSecret: string): Promise<IGDBGameCandidate[]> {
        const token = await this.getTwitchToken(clientId, clientSecret);
        if (!token) {
            return [];
        }

        try {
            const searchUrl = `https://corsproxy.io/?${encodeURIComponent('https://api.igdb.com/v4/games')}`;
            const bodyQuery = `search "${query.replace(/"/g, '\\"')}"; fields name, slug, first_release_date, rating, cover.url; limit 10;`;

            const response = await fetch(searchUrl, {
                method: 'POST',
                headers: {
                    'Client-ID': clientId,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/plain'
                },
                body: bodyQuery
            });

            if (!response.ok) {
                throw new Error(`IGDB search failed: ${response.statusText}`);
            }

            const games: IGDBGame[] = await response.json();
            return games.map((game) => {
                const coverUrl = game.cover?.url
                    ? 'https:' + game.cover.url.replace('t_thumb', 't_cover_big')
                    : undefined;
                const releaseYear = game.first_release_date
                    ? new Date(game.first_release_date * 1000).getFullYear()
                    : undefined;

                return {
                    id: game.id,
                    name: game.name,
                    slug: game.slug,
                    coverUrl,
                    releaseYear,
                    rating: game.rating ? Math.round(game.rating) : undefined
                };
            });
        } catch (error) {
            console.error('IGDB search error:', error);
            return [];
        }
    }

    /**
     * Fetches detailed metadata from IGDB for a selected game ID
     */
    async fetchIGDBGameDetails(gameId: number, clientId: string, clientSecret: string): Promise<ExtractedMetadata | null> {
        const token = await this.getTwitchToken(clientId, clientSecret);
        if (!token) return null;

        try {
            const detailsUrl = `https://corsproxy.io/?${encodeURIComponent('https://api.igdb.com/v4/games')}`;
            const bodyQuery = `where id = ${gameId}; fields name, slug, aggregated_rating, rating, websites.url, websites.category, external_games.uid, external_games.url, external_games.external_game_source;`;

            const response = await fetch(detailsUrl, {
                method: 'POST',
                headers: {
                    'Client-ID': clientId,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/plain'
                },
                body: bodyQuery
            });

            if (!response.ok) {
                throw new Error(`IGDB fetch details failed: ${response.statusText}`);
            }

            const games: IGDBGame[] = await response.json();
            if (games.length === 0) return null;

            const game = games[0];
            const metadata = this.extractFromIGDBGame(game);



            // Fetch Steam store details if Steam App ID is found
            if (metadata.steamAppId) {
                const steamDetails = await this.fetchSteamDetails(metadata.steamAppId);
                Object.assign(metadata, steamDetails);
            }

            return metadata;
        } catch (error) {
            console.error('IGDB fetch details error:', error);
            return null;
        }
    }

    /**
     * Extracts values from IGDB game structure
     */
    private extractFromIGDBGame(game: IGDBGame): ExtractedMetadata {
        const data: ExtractedMetadata = {
            igdb: game.slug,
        };

        if (game.aggregated_rating) {
            data.igdbScore = Math.round(game.aggregated_rating).toString();
        } else if (game.rating) {
            data.igdbScore = Math.round(game.rating).toString();
        }

        // Parse websites
        if (game.websites) {
            for (const site of game.websites) {
                const url = site.url;
                if (!url) continue;

                // Website category mapping:
                // 1: Official, 3: Wikipedia, 13: Steam
                if (site.category === 1) {
                    data.officialSite = url;
                } else if (site.category === 3) {
                    const match = url.match(/wikipedia\.org\/wiki\/([^?#]+)/);
                    if (match) {
                        data.wikipedia = decodeURIComponent(match[1]).replace(/_/g, ' ');
                    }
                } else if (site.category === 13) {
                    const match = url.match(/store\.steampowered\.com\/app\/(\d+)/);
                    if (match) {
                        data.steamAppId = match[1];
                    }
                }

                // Parse Metacritic ID if present under websites
                if (url.includes('metacritic.com/game/')) {
                    const match = url.match(/metacritic\.com\/game\/([a-zA-Z0-9/_-]+)/);
                    if (match) {
                        data.metacriticId = `game/${match[1].replace(/\?.*$/, '')}`;
                    }
                }
            }
        }

        // Parse external games for store IDs and OpenCritic ID
        if (game.external_games) {
            for (const ext of game.external_games) {
                const sourceId = typeof ext.external_game_source === 'object'
                    ? ext.external_game_source.id
                    : ext.external_game_source;
                const uid = ext.uid;
                const url = ext.url;

                // Steam = 1, GOG = 5 or 2 (check GOG URLs), Epic = 11, Microsoft = 26, Itch = 28, OpenCritic = 36
                if (sourceId === 1 || (url && url.includes('store.steampowered.com'))) {
                    if (uid) data.steamAppId = uid;
                } else if (sourceId === 5 || sourceId === 2 || (url && url.includes('gog.com'))) {
                    if (uid && isNaN(Number(uid))) {
                        data.gogComId = uid;
                    } else if (url) {
                        const match = url.match(/gog\.com\/(?:[a-zA-Z-]+\/)?game\/([a-zA-Z0-9_-]+)/);
                        if (match) data.gogComId = match[1];
                    }
                } else if (sourceId === 11 || (url && url.includes('epicgames.com'))) {
                    if (uid) {
                        data.epic = uid.startsWith('p/') || uid.startsWith('product/') ? uid : `p/${uid}`;
                    } else if (url) {
                        const match = url.match(/epicgames\.com\/(?:[a-zA-Z-]+\/)?p\/([a-zA-Z0-9_-]+)/);
                        if (match) data.epic = `p/${match[1]}`;
                    }
                } else if (sourceId === 26 || (url && (url.includes('microsoft.com') || url.includes('xbox.com')))) {
                    if (uid) data.microsoft = uid;
                } else if (sourceId === 28 || (url && url.includes('itch.io'))) {
                    if (uid) {
                        data.itch = uid;
                    } else if (url) {
                        const match = url.match(/([a-zA-Z0-9_-]+)\.itch\.io\/([a-zA-Z0-9_-]+)/);
                        if (match) data.itch = `${match[1]}/${match[2]}`;
                    }
                } else if (sourceId === 36 || (url && url.includes('opencritic.com'))) {
                    if (uid) data.opencriticId = uid;
                }

                // Parse Metacritic ID if present under external_games
                if (url && url.includes('metacritic.com/game/')) {
                    const match = url.match(/metacritic\.com\/game\/([a-zA-Z0-9/_-]+)/);
                    if (match) {
                        data.metacriticId = `game/${match[1].replace(/\?.*$/, '')}`;
                    }
                }
            }
        }

        return data;
    }

    /**
     * Searches Steam and GOG directly as a fallback if Twitch API is not set up
     */
    async searchGeneralStoreFallback(gameTitle: string): Promise<ExtractedMetadata | null> {
        try {
            // Search Steam store
            const searchRes = await fetch(`https://corsproxy.io/?${encodeURIComponent(
                `https://store.steampowered.com/api/storesearch/?term=${gameTitle}&l=english&cc=US`
            )}`);
            if (!searchRes.ok) return null;
            const searchData = await searchRes.json();
            
            if (searchData && searchData.items && searchData.items.length > 0) {
                const item = searchData.items[0];
                const appId = item.id.toString();

                const details = await this.fetchSteamDetails(appId);
                return {
                    steamAppId: appId,
                    ...details
                };
            }
        } catch (error) {
            console.error('Steam search fallback error:', error);
        }
        return null;
    }

    /**
     * Queries Steam AppDetails for Metacritic info and official site
     */
    async fetchSteamDetails(appId: string): Promise<Partial<ExtractedMetadata>> {
        try {
            const detailsUrl = `https://corsproxy.io/?${encodeURIComponent(
                `https://store.steampowered.com/api/appdetails?appids=${appId}`
            )}`;
            
            const response = await fetch(detailsUrl);
            if (!response.ok) return {};

            const data = await response.json();
            if (data && data[appId] && data[appId].success) {
                const gameData = data[appId].data;
                const result: Partial<ExtractedMetadata> = {};

                if (gameData.metacritic) {
                    result.metacriticScore = gameData.metacritic.score.toString();
                    const url = gameData.metacritic.url;
                    if (url) {
                        const match = url.match(/metacritic\.com\/game\/([a-zA-Z0-9/_-]+)/);
                        if (match) {
                            result.metacriticId = `game/${match[1].replace(/\?.*$/, '')}`;
                        }
                    }
                }
                if (gameData.website) {
                    result.officialSite = gameData.website;
                }
                
                // Fallback GOG extraction from Steam links if possible, or just leave it
                return result;
            }
        } catch (error) {
            console.error('Failed to fetch Steam details:', error);
        }
        return {};
    }



    /**
     * Leverages Gemini with Google Search grounding to retrieve metadata
     */
    async fetchMetadataWithGemini(gameTitle: string, geminiService: GeminiService): Promise<ExtractedMetadata | null> {
        const prompt = `
You are a video game database scraper. Search the web and gather the following metadata for the video game "${gameTitle}".
Return the result strictly as a valid JSON object matching the following structure:
{
  "steamAppId": "string (numerical AppID, e.g. '70')",
  "gogComId": "string (slug from GOG URL, e.g. 'half_life')",
  "epic": "string (Epic Store slug, e.g. 'product/game' or 'p/game')",
  "microsoft": "string (Microsoft Store ID, e.g. '9nblggh431sx')",
  "itch": "string (Itch.io slug, e.g. 'user/game')",
  "zoom": "string (Zoom Platform slug, e.g. 'zoom-slug')",
  "officialSite": "string (Official site URL, e.g. 'https://...')",
  "hltb": "string (numerical HowLongToBeat ID, e.g. '12345')",
  "igdb": "string (IGDB game slug, e.g. 'half-life-2')",
  "mobygames": "string (MobyGames game path/slug, e.g. '/game/half-life')",
  "wikipedia": "string (Wikipedia article title, e.g. 'Half-Life (video game)')",
  "vndb": "string (VNDB ID, e.g. 'v17')",
  "lutris": "string (Lutris game slug, e.g. 'half-life-2')",
  "wineHq": "string (WineHQ AppDB numeric ID or slug, e.g. '1234')",
  "metacriticScore": "string (Metacritic metascore, e.g. '96')",
  "metacriticId": "string (Metacritic slug, e.g. 'game/pc/half-life-2')",
  "opencriticScore": "string (OpenCritic average score, e.g. '96')",
  "opencriticId": "string (OpenCritic game ID, e.g. '123')",
  "igdbScore": "string (IGDB aggregated rating out of 100, e.g. '96')"
}
Rules:
- Provide ONLY the JSON. No markdown formatting, no code block backticks (do not wrap in \`\`\`json).
- If a value is unknown, use an empty string.
- Verify that the IDs are correct and point to the PC version of the game if applicable.
`;

        try {
            const result = await geminiService.generateJSONWithSearch<ExtractedMetadata>(prompt);
            // Clean empty strings to undefined
            const cleaned: ExtractedMetadata = {};
            Object.keys(result).forEach((key) => {
                const val = (result as any)[key];
                if (val && typeof val === 'string' && val.trim() !== '') {
                    (cleaned as any)[key] = val.trim();
                }
            });
            return cleaned;
        } catch (error) {
            console.error('Failed to fetch metadata with Gemini grounding:', error);
            return null;
        }
    }
}

export const metadataFillerService = new MetadataFillerService();
