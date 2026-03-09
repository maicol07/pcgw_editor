/**
 * PCGamingWiki Cargo API Service
 * Provides search and autocomplete functionality using Cargo tables with caching
 */
import { ofetch } from 'ofetch';
import { useStorage } from '@vueuse/core';
import { getDirectApiUrl } from '../config/api';
const CACHE_KEY = 'pcgw_api_cache_v2';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const normalizeFilename = (name: string) => name.replace(/_/g, ' ').trim();

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
            return await ofetch<T>(getDirectApiUrl(), {
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
        const info = await this.getImageInfo(filename);
        return info?.url || null;
    }

    async getImageInfo(filename: string): Promise<{ url: string; user: string; size: number; width: number; height: number } | null> {
        const infos = await this.getImagesInfo([filename]);
        return infos[filename] || null;
    }

    async getImagesInfo(filenames: string[]): Promise<Record<string, { url: string; user: string; size: number; width: number; height: number }>> {
        if (!filenames.length) return {};

        const results: Record<string, { url: string; user: string; size: number; width: number; height: number }> = {};
        const toFetch: string[] = [];

        filenames.forEach(filename => {
            const key = normalizeFilename(filename);
            const cacheKey = `image_info:${key}`;
            const cached = this.cache.value[cacheKey];
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                try {
                    results[key] = JSON.parse(cached.data[0]);
                } catch (e) {
                    toFetch.push(filename);
                }
            } else {
                toFetch.push(filename);
            }
        });

        if (!toFetch.length) return results;

        try {
            // MediaWiki query limit is usually 50 for normal users, let's chunk if needed
            const CHUNK_SIZE = 50;
            for (let i = 0; i < toFetch.length; i += CHUNK_SIZE) {
                const chunk = toFetch.slice(i, i + CHUNK_SIZE);
                const response = await this.fetchApi<{ 
                    query?: { 
                        pages?: Record<string, { title: string; imageinfo?: { url: string; user: string; size: number; width: number; height: number }[] }> 
                    } 
                }>({
                    action: 'query',
                    titles: chunk.map(f => `File:${f}`).join('|'),
                    prop: 'imageinfo',
                    iiprop: 'url|user|size|dimensions',
                });

                if (response?.query?.pages) {
                    Object.values(response.query.pages).forEach(page => {
                        if (page.imageinfo?.[0]) {
                            const rawName = page.title.replace(/^File:/, '');
                            const normalizedName = normalizeFilename(rawName);
                            const info = {
                                url: page.imageinfo[0].url,
                                user: page.imageinfo[0].user,
                                size: page.imageinfo[0].size,
                                width: page.imageinfo[0].width,
                                height: page.imageinfo[0].height
                            };
                            results[normalizedName] = info;
                            
                            // Update cache with normalized name
                            const cacheKey = `image_info:${normalizedName}`;
                            this.cache.value[cacheKey] = {
                                data: [JSON.stringify(info)],
                                timestamp: Date.now()
                            };
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to get batch image info:', error);
        }

        return results;
    }

    async fetchTemplateWikitext(templateType: 'singleplayer' | 'multiplayer' | 'unknown'): Promise<string | null> {
        const result = await this.fetchWikitext(`PCGamingWiki:Sample_article/Game_(${templateType})`, `template:${templateType}`);
        return result?.content || null;
    }

    async fetchWikitext(title: string, cacheKeyBase?: string): Promise<{ content: string; revid: number } | null> {
        const cacheKey = cacheKeyBase || `wikitext:${title}`;
        const cached = this.getFromCache(cacheKey);
        // If cached and cache is a simple string array (old format), we might need to handle it.
        // For simplicity, let's just clear cache or handle the new format.
        if (cached && cached.length >= 2) {
            return { content: cached[0], revid: parseInt(cached[1]) };
        }

        try {
            const result = await this.fetchApi<{ query?: { pages?: Record<string, { revisions?: { revid: number, slots?: { main?: { '*'?: string } } }[] }> } }>({
                action: 'query',
                prop: 'revisions',
                titles: title,
                rvprop: 'content|ids',
                rvslots: 'main',
            });

            if (!result?.query?.pages) return null;
            const pages = Object.values(result.query.pages);
            const page = pages[0];

            const content = page?.revisions?.[0]?.slots?.main?.['*'];
            const revid = page?.revisions?.[0]?.revid;
            if (content === undefined || revid === undefined) return null;

            this.setCache(cacheKey, [content, revid.toString()]);
            return { content, revid };
        } catch (error) {
            console.error(`Failed to fetch wikitext for ${title}:`, error);
            return null;
        }
    }

    async getLatestRevisionInfo(title: string): Promise<{ revid: number } | null> {
        try {
            const result = await this.fetchApi<{ query?: { pages?: Record<string, { revisions?: { revid: number }[] }> } }>({
                action: 'query',
                prop: 'revisions',
                titles: title,
                rvprop: 'ids',
                rvlimit: '1'
            });

            if (!result?.query?.pages) return null;
            const pages = Object.values(result.query.pages);
            const page = pages[0];
            const revid = page?.revisions?.[0]?.revid;

            return revid !== undefined ? { revid } : null;
        } catch (error) {
            console.error(`Failed to fetch revision info for ${title}:`, error);
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
                const titleParts = pathParts.slice(2).filter(p => p !== '');
                return decodeURIComponent(titleParts.join('/')).replace(/_/g, ' ');
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

    async getPageContent(title: string): Promise<string | null> {
        try {
            const response = await this.fetchApi<{ 
                query?: { 
                    pages?: Record<string, { revisions?: any[] }> 
                } 
            }>({
                action: 'query',
                titles: title,
                prop: 'revisions',
                rvprop: 'content',
                rvslots: 'main'
            });

            const pages = response?.query?.pages || {};
            const page = Object.values(pages)[0];
            const revision = page?.revisions?.[0];
            
            // Handle both legacy and modern (rvslots) MediaWiki formats
            if (revision?.slots?.main?.['*']) {
                return revision.slots.main['*'];
            }
            return revision?.['*'] || null;
        } catch (error) {
            console.error('Failed to fetch page content:', error);
            return null;
        }
    }

    resetCache(): void {
        this.cache.value = {};
    }
}

export const pcgwApi = new PCGWApiService();
