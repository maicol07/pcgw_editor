/**
 * PCGamingWiki Cargo API Service
 * Provides search and autocomplete functionality using Cargo tables with caching
 */
import { ofetch } from 'ofetch';
import { useStorage } from '@vueuse/core';

const API_BASE = 'https://www.pcgamingwiki.com/w/api.php';
const CACHE_KEY = 'pcgw_api_cache_v2';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface CargoResult {
    title: {
        [key: string]: string;
    };
}

class PCGWApiService {
    // Persist cache using VueUse's useStorage
    private cache = useStorage<Record<string, CacheEntry<string[]>>>(CACHE_KEY, {});

    private async fetchApi<T = any>(params: Record<string, string>): Promise<T | null> {
        try {
            return await ofetch<T>(API_BASE, {
                query: {
                    format: 'json',
                    origin: '*',
                    ...params
                },
                parseResponse: JSON.parse
            });
        } catch (error) {
            console.error('PCGamingWiki API error:', error);
            return null;
        }
    }

    private getFromCache(key: string): string[] | null {
        const entry = this.cache.value[key];
        if (!entry) return null;

        if (Date.now() - entry.timestamp > CACHE_DURATION) {
            delete this.cache.value[key];
            return null;
        }
        return entry.data;
    }

    private setCache(key: string, data: string[]): void {
        this.cache.value[key] = {
            data,
            timestamp: Date.now(),
        };
    }

    private async cargoQuery(field: string, searchTerm: string): Promise<string[]> {
        if (!searchTerm || searchTerm.length < 2) return [];

        const cacheKey = `cargo:${field}:${searchTerm.toLowerCase()}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const result = await this.fetchApi<{ cargoquery?: CargoResult[] }>({
                action: 'cargoquery',
                tables: 'Infobox_game',
                fields: `${field}=value`,
                where: `${field} HOLDS LIKE "%${searchTerm}%"`,
                group_by: field,
                limit: '20',
            });

            if (!result?.cargoquery || !Array.isArray(result.cargoquery)) {
                return [];
            }

            const values = new Set<string>();
            result.cargoquery.forEach((item) => {
                const value = item.title?.value;
                if (value) {
                    value.split(',').forEach(v => {
                        let trimmed = v.trim();
                        trimmed = trimmed.replace(/^(Company|Engine|Series):/i, '');
                        if (trimmed && trimmed.toLowerCase().includes(searchTerm.toLowerCase())) {
                            values.add(trimmed);
                        }
                    });
                }
            });

            const suggestions = Array.from(values).slice(0, 10);
            this.setCache(cacheKey, suggestions);
            return suggestions;
        } catch (error) {
            console.error('Cargo query error:', error);
            return [];
        }
    }

    async searchCompanies(query: string): Promise<string[]> {
        const [devs, pubs] = await Promise.all([
            this.cargoQuery('Infobox_game.Developers', query),
            this.cargoQuery('Infobox_game.Publishers', query),
        ]);
        return Array.from(new Set([...devs, ...pubs])).slice(0, 10);
    }

    async searchEngines(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Engines', query);
    }

    async searchSeries(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Series', query);
    }

    async searchGenres(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Genres', query);
    }

    async searchThemes(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Themes', query);
    }

    async searchPerspectives(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Perspectives', query);
    }

    async searchPacing(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Pacing', query);
    }

    async searchControls(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Controls', query);
    }

    async searchSports(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Sports', query);
    }

    async searchVehicles(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Vehicles', query);
    }

    async searchArtStyles(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Art_styles', query);
    }

    async searchMonetizations(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Monetizations', query);
    }

    async searchMicrotransactions(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Microtransactions', query);
    }

    async searchModes(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Modes', query);
    }

    async searchFiles(query: string): Promise<string[]> {
        if (!query || query.length < 2) return [];

        try {
            const result = await this.fetchApi<{ query?: { search?: { title: string }[] } }>({
                action: 'query',
                list: 'search',
                srsearch: query,
                srnamespace: '6',
                srlimit: '10',
            });

            if (!result?.query?.search) return [];
            return result.query.search.map((item) => item.title.replace(/^File:/, ''));
        } catch (error) {
            console.error('Failed to search files:', error);
            return [];
        }
    }

    async searchPages(query: string): Promise<string[]> {
        if (!query || query.length < 2) return [];

        try {
            // opensearch returns [query, [titles], [descriptions], [urls]]
            const result = await this.fetchApi<[string, string[], string[], string[]]>({
                action: 'opensearch',
                search: query,
                namespace: '0',
                limit: '10',
            });

            if (!result || !Array.isArray(result[1])) return [];
            return result[1];
        } catch (error) {
            console.error('Failed to search pages:', error);
            return [];
        }
    }

    // New: User search for NotesEditorDialog
    async searchUsers(query: string): Promise<string[]> {
        if (!query || query.length < 2) return [];
        try {
            // Cache user searches? Maybe not strictly necessary for such a quick lookup but consistent.
            const cacheKey = `user:${query.toLowerCase()}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const result = await this.fetchApi<{ query?: { allusers?: { name: string }[] } }>({
                action: 'query',
                list: 'allusers',
                auprefix: query,
                aulimit: '10'
            });

            if (result?.query?.allusers) {
                const users = result.query.allusers.map(u => u.name);
                this.setCache(cacheKey, users);
                return users;
            }
            return [];
        } catch (e) {
            return [];
        }
    }

    async getImageUrl(filename: string): Promise<string | null> {
        if (!filename) return null;

        const cacheKey = `image:${filename}`;
        const cached = this.getFromCache(cacheKey);
        if (cached && cached.length > 0) return cached[0];

        try {
            const result = await this.fetchApi<{ query?: { pages?: Record<string, { imageinfo?: { url: string }[] }> } }>({
                action: 'query',
                titles: `File:${filename}`,
                prop: 'imageinfo',
                iiprop: 'url',
            });

            if (!result?.query?.pages) return null;
            const pages = Object.values(result.query.pages);
            const page = pages[0];

            if (!page?.imageinfo?.[0]?.url) return null;

            const imageUrl = page.imageinfo[0].url;
            this.setCache(cacheKey, [imageUrl]);
            return imageUrl;
        } catch (error) {
            console.error('Failed to get image URL:', error);
            return null;
        }
    }

    async fetchTemplateWikitext(templateType: 'singleplayer' | 'multiplayer' | 'unknown'): Promise<string | null> {
        return this.fetchWikitext(`PCGamingWiki:Sample_article/Game_(${templateType})`, `template:${templateType}`);
    }

    async fetchWikitext(title: string, cacheKeyBase?: string): Promise<string | null> {
        const cacheKey = cacheKeyBase || `wikitext:${title}`;
        const cached = this.getFromCache(cacheKey);
        if (cached && cached.length > 0) return cached[0];

        try {
            const result = await this.fetchApi<{ query?: { pages?: Record<string, { revisions?: { slots?: { main?: { '*'?: string } } }[] }> } }>({
                action: 'query',
                prop: 'revisions',
                titles: title,
                rvprop: 'content',
                rvslots: 'main',
            });

            if (!result?.query?.pages) return null;
            const pages = Object.values(result.query.pages);
            const page = pages[0];

            const content = page?.revisions?.[0]?.slots?.main?.['*'];
            if (!content) return null;

            this.setCache(cacheKey, [content]);
            return content;
        } catch (error) {
            console.error(`Failed to fetch wikitext for ${title}:`, error);
            return null;
        }
    }

    extractTitleFromUrl(url: string): string | null {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname !== 'www.pcgamingwiki.com') return null;

            // Handle both /wiki/Title and /w/index.php?title=Title
            const pathParts = parsedUrl.pathname.split('/');
            if (pathParts[1] === 'wiki' && pathParts[2]) {
                return decodeURIComponent(pathParts[2]).replace(/_/g, ' ');
            }

            const titleParam = parsedUrl.searchParams.get('title');
            if (titleParam) {
                return decodeURIComponent(titleParam).replace(/_/g, ' ');
            }

            return null;
        } catch {
            return null;
        }
    }

    async prewarmCache(): Promise<void> {
        // Implementation simplified or removed if less critical, but kept for parity
        const commonSearches = [
            { fn: this.searchCompanies.bind(this), queries: ['Valve', 'EA', 'Ubisoft', 'Sony', 'Microsoft', 'Nintendo'] },
            { fn: this.searchEngines.bind(this), queries: ['Unreal', 'Unity', 'Source', 'id Tech'] },
        ];

        for (const { fn, queries } of commonSearches) {
            for (const query of queries) {
                await fn(query);
            }
        }
    }

    clearCache(): void {
        this.cache.value = {};
    }
}

export const pcgwApi = new PCGWApiService();

setTimeout(() => {
    pcgwApi.prewarmCache().catch(console.warn);
}, 2000);
