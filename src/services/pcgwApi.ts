/**
 * PCGamingWiki Cargo API Service
 * Provides search and autocomplete functionality using Cargo tables with caching
 */
import { useStorage } from '@vueuse/core';
import { getDirectApiUrl, getApiHeaders, apiFetch, getProxiedImageUrl } from '../config/api';
import { getRevisionText, putRevisionText } from '../db';
import { pcgwAuth } from './pcgwAuth';
import { notifyPermissionDenied } from '../utils/notifications';
const CACHE_KEY = 'pcgw_api_cache_v2';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const normalizeFilename = (name: string) => name.replace(/_/g, ' ').trim();

export const AUTH_REQUIRED_DATA_SOURCES = [
    'genres',
    'themes',
    'perspectives',
    'pacing',
    'controls',
    'sports',
    'vehicles',
    'artStyles',
    'monetization',
    'microtransactions',
    'modes'
] as const;

export type AuthRequiredDataSource = typeof AUTH_REQUIRED_DATA_SOURCES[number];

export const isDataSourceAuthRequired = (source?: string): boolean => {
    if (!source) return false;
    return (AUTH_REQUIRED_DATA_SOURCES as readonly string[]).includes(source);
};

export interface ImageInfo {
    url: string;
    user: string;
    size: number;
    width: number;
    height: number;
    canonicalName: string;
}

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

    // In-flight deduplication and batching state
    private pendingSha1Requests = new Map<string, Promise<string[]>>();
    private pendingImageInfoRequests = new Map<string, Promise<ImageInfo | null>>();
    private batchQueue = new Set<string>();
    private batchTimer: any = null;
    private batchCallbacks = new Map<string, Array<(info: ImageInfo | null) => void>>();

    private async fetchApi<T = any>(params: Record<string, string>, requiresAuth = false): Promise<T | null> {
        try {
            if (requiresAuth && pcgwAuth.isLoggedIn) {
                return await pcgwAuth.apiPost(params, 'GET');
            }
            const res = await apiFetch<T>(getDirectApiUrl(), {
                query: {
                    format: 'json',
                    origin: '*',
                    ...params
                },
                headers: getApiHeaders(),
                parseResponse: JSON.parse
            });
            if ((res as any)?.error?.code === 'permissiondenied') {
                notifyPermissionDenied((res as any)?.error?.info);
            }
            return res;
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
        return entry.data.map(item => typeof item === 'string' ? item.replace(/\r/g, '') : item);
    }

    private setCache(key: string, data: string[]): void {
        this.cache.value[key] = {
            data,
            timestamp: Date.now(),
        };
    }

    private async cargoQuery(field: string, searchTerm?: string): Promise<string[]> {
        // Cargo queries strictly require authentication with bot password on PCGamingWiki
        if (!pcgwAuth.isLoggedIn) {
            return [];
        }

        const term = (searchTerm || '').trim();
        if (term && term.length < 2) return [];

        const cacheKey = term 
            ? `cargo:${field}:${term.toLowerCase()}` 
            : `cargo:${field}:__initial__`;
            
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const queryParams: Record<string, string> = {
                action: 'cargoquery',
                tables: 'Game',
                fields: `${field}=value`,
                group_by: field,
                limit: term ? '20' : '50',
            };

            if (term) {
                queryParams.where = `${field} HOLDS LIKE "%${term}%"`;
            }

            const result = await this.fetchApi<{ cargoquery?: CargoResult[] }>(queryParams, true);

            const values = new Set<string>();
            if (result?.cargoquery && Array.isArray(result.cargoquery)) {
                result.cargoquery.forEach((item) => {
                    const value = item.title?.value;
                    if (value) {
                        value.split(',').forEach(v => {
                            let trimmed = v.trim();
                            trimmed = trimmed.replace(/^(Company|Engine|Series):/i, '');
                            
                            const lower = trimmed.toLowerCase();
                            if (lower === 'select...' || lower === 'select' || lower === 'search...' || !trimmed) {
                                return;
                            }

                            if (term ? trimmed.toLowerCase().includes(term.toLowerCase()) : true) {
                                values.add(trimmed);
                            }
                        });
                    }
                });
            }

            const suggestions = Array.from(values).slice(0, 10);
            if (suggestions.length > 0) {
                this.setCache(cacheKey, suggestions);
            }
            return suggestions;
        } catch (error) {
            console.error('Cargo query error:', error);
            return [];
        }
    }

    async searchCompanies(query?: string): Promise<string[]> {
        const term = (query || '').trim();
        if (term && term.length < 2) return [];

        const cacheKey = term ? `company:${term.toLowerCase()}` : 'company:__initial__';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let titles: string[] = [];
            if (!term) {
                const response = await this.fetchApi<{ query?: { allpages?: { title: string }[] } }>({
                    action: 'query',
                    list: 'allpages',
                    apnamespace: '416',
                    aplimit: '20',
                });
                titles = response?.query?.allpages?.map(p => p.title) || [];
            } else {
                const result = await this.fetchApi<[string, string[], string[], string[]]>({
                    action: 'opensearch',
                    search: term,
                    namespace: '416',
                    limit: '10',
                });
                titles = result && Array.isArray(result[1]) ? result[1] : [];
            }

            const results = titles.map(t => t.replace(/^Company:/i, '').trim()).filter(Boolean);
            if (results.length > 0) {
                this.setCache(cacheKey, results);
            }
            return results;
        } catch (e) {
            console.error('Company search error:', e);
            return [];
        }
    }

    async searchEngines(query?: string): Promise<string[]> {
        const term = (query || '').trim();
        if (term && term.length < 2) return [];

        const cacheKey = term ? `engine:${term.toLowerCase()}` : 'engine:__initial__';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let titles: string[] = [];
            if (!term) {
                const response = await this.fetchApi<{ query?: { allpages?: { title: string }[] } }>({
                    action: 'query',
                    list: 'allpages',
                    apnamespace: '404',
                    aplimit: '20',
                });
                titles = response?.query?.allpages?.map(p => p.title) || [];
            } else {
                const result = await this.fetchApi<[string, string[], string[], string[]]>({
                    action: 'opensearch',
                    search: term,
                    namespace: '404',
                    limit: '10',
                });
                titles = result && Array.isArray(result[1]) ? result[1] : [];
            }

            const results = titles.map(t => t.replace(/^Engine:/i, '').trim()).filter(Boolean);
            if (results.length > 0) {
                this.setCache(cacheKey, results);
            }
            return results;
        } catch (e) {
            console.error('Engine search error:', e);
            return [];
        }
    }

    async searchSeries(query?: string): Promise<string[]> {
        const term = (query || '').trim();
        if (term && term.length < 2) return [];

        const cacheKey = term ? `series:${term.toLowerCase()}` : 'series:__initial__';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let titles: string[] = [];
            if (!term) {
                const response = await this.fetchApi<{ query?: { allpages?: { title: string }[] } }>({
                    action: 'query',
                    list: 'allpages',
                    apnamespace: '402',
                    aplimit: '20',
                });
                titles = response?.query?.allpages?.map(p => p.title) || [];
            } else {
                const result = await this.fetchApi<[string, string[], string[], string[]]>({
                    action: 'opensearch',
                    search: term,
                    namespace: '402',
                    limit: '10',
                });
                titles = result && Array.isArray(result[1]) ? result[1] : [];
            }

            const results = titles.map(t => t.replace(/^Series:/i, '').trim()).filter(Boolean);
            if (results.length > 0) {
                this.setCache(cacheKey, results);
            }
            return results;
        } catch (e) {
            console.error('Series search error:', e);
            return [];
        }
    }

    async searchGenres(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Genres', query);
    }

    async searchThemes(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Themes', query);
    }

    async searchPerspectives(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Perspectives', query);
    }

    async searchPacing(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Pacing', query);
    }

    async searchControls(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Controls', query);
    }

    async searchSports(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Sports', query);
    }

    async searchVehicles(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Vehicles', query);
    }

    async searchArtStyles(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Art_styles', query);
    }

    async searchMonetizations(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Monetization', query);
    }

    async searchMicrotransactions(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Microtransactions', query);
    }

    async searchModes(query?: string): Promise<string[]> {
        return this.cargoQuery('Game.Modes', query);
    }

    /**
     * Finds images on PCGW that match a specific SHA-1 hash
     * @param sha1 Hex string of the SHA-1 hash
     */
    async getImagesByHash(sha1: string): Promise<string[]> {
        if (!sha1) return [];

        const cacheKey = `hash:${sha1}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        if (this.pendingSha1Requests.has(sha1)) {
            return this.pendingSha1Requests.get(sha1)!;
        }

        const requestPromise = (async () => {
            try {
                const result = await this.fetchApi<{ 
                    query?: { 
                        allimages?: { title: string }[] 
                    } 
                }>({
                    action: 'query',
                    list: 'allimages',
                    aisha1: sha1,
                    ailimit: '10'
                });

                if (!result?.query?.allimages) {
                    this.setCache(cacheKey, []);
                    return [];
                }

                const titles = result.query.allimages.map(img => img.title.replace(/^File:/, ''));
                this.setCache(cacheKey, titles);
                return titles;
            } catch (error) {
                console.error('Failed to get images by hash:', error);
                return [];
            } finally {
                this.pendingSha1Requests.delete(sha1);
            }
        })();

        this.pendingSha1Requests.set(sha1, requestPromise);
        return requestPromise;
    }

    async searchFiles(query?: string): Promise<string[]> {
        const term = (query || '').trim();
        if (term && term.length < 2) return [];

        try {
            if (!term) {
                const response = await this.fetchApi<{ query?: { allimages?: { title: string }[] } }>({
                    action: 'query',
                    list: 'allimages',
                    ailimit: '20',
                });
                const prefixTitles = response?.query?.allimages?.map(item => item.title) || [];
                return prefixTitles.map((title) => title.replace(/^File:/, ''));
            }

            const [searchResult, prefixResult] = await Promise.all([
                this.fetchApi<{ query?: { search?: { title: string }[] } }>({
                    action: 'query',
                    list: 'search',
                    srsearch: term,
                    srnamespace: '6',
                    srlimit: '20',
                }),
                this.fetchApi<{ query?: { allimages?: { title: string }[] } }>({
                    action: 'query',
                    list: 'allimages',
                    aiprefix: term,
                    ailimit: '20',
                })
            ]);

            const searchTitles = searchResult?.query?.search?.map(item => item.title) || [];
            const prefixTitles = prefixResult?.query?.allimages?.map(item => item.title) || [];
            
            // Merge and de-duplicate
            const allTitles = Array.from(new Set([...prefixTitles, ...searchTitles]));
            return allTitles.map((title) => title.replace(/^File:/, ''));
        } catch (error) {
            console.error('Failed to search files:', error);
            return [];
        }
    }

    async searchPages(query?: string): Promise<string[]> {
        const term = (query || '').trim();
        if (term && term.length < 2) return [];

        try {
            if (!term) {
                const response = await this.fetchApi<{ query?: { allpages?: { title: string }[] } }>({
                    action: 'query',
                    list: 'allpages',
                    aplimit: '10',
                });
                const prefixTitles = response?.query?.allpages?.map(item => item.title) || [];
                return prefixTitles;
            }

            // opensearch returns [query, [titles], [descriptions], [urls]]
            const result = await this.fetchApi<[string, string[], string[], string[]]>({
                action: 'opensearch',
                search: term,
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
    async searchUsers(query?: string): Promise<string[]> {
        const term = (query || '').trim();
        if (term && term.length < 2) return [];
        try {
            // Cache user searches? Maybe not strictly necessary for such a quick lookup but consistent.
            const cacheKey = term ? `user:${term.toLowerCase()}` : 'user:__initial__';
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const params: Record<string, string> = {
                action: 'query',
                list: 'allusers',
                aulimit: '10'
            };
            if (term) {
                params.auprefix = term;
            }

            const result = await this.fetchApi<{ query?: { allusers?: { name: string }[] } }>(params);

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
        const info = await this.getImageInfo(filename);
        return getProxiedImageUrl(info?.url || null);
    }

    async getImageInfo(filename: string): Promise<ImageInfo | null> {
        if (!filename) return null;
        const infos = await this.getImagesInfo([filename]);
        const normKey = normalizeFilename(filename);
        return infos[normKey] || infos[filename] || null;
    }

    private queueImageInfoFetch(filename: string): Promise<ImageInfo | null> {
        const normKey = normalizeFilename(filename);

        if (this.pendingImageInfoRequests.has(normKey)) {
            return this.pendingImageInfoRequests.get(normKey)!;
        }

        const promise = new Promise<ImageInfo | null>((resolve) => {
            if (!this.batchCallbacks.has(normKey)) {
                this.batchCallbacks.set(normKey, []);
            }
            this.batchCallbacks.get(normKey)!.push(resolve);

            this.batchQueue.add(filename);

            if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => {
                    void this.flushImageInfoBatch();
                }, 20);
            }
        });

        this.pendingImageInfoRequests.set(normKey, promise);
        return promise;
    }

    private async flushImageInfoBatch(): Promise<void> {
        this.batchTimer = null;
        const toFetch = Array.from(this.batchQueue);
        const callbacksMap = new Map(this.batchCallbacks);

        this.batchQueue.clear();
        this.batchCallbacks.clear();

        if (!toFetch.length) return;

        try {
            const CHUNK_SIZE = 50;
            for (let i = 0; i < toFetch.length; i += CHUNK_SIZE) {
                const chunk = toFetch.slice(i, i + CHUNK_SIZE);
                const response = await this.fetchApi<{ 
                    query?: { 
                        pages?: Record<string, { title: string; imageinfo?: { url: string; user: string; size: number; width: number; height: number }[] }>,
                        redirects?: { from: string; to: string }[]
                    } 
                }>({
                    action: 'query',
                    titles: chunk.map(f => `File:${f}`).join('|'),
                    prop: 'imageinfo',
                    iiprop: 'url|user|size|dimensions',
                    redirects: '1'
                });

                const chunkResults: Record<string, ImageInfo> = {};

                if (response?.query?.pages) {
                    const redirectMap: Record<string, string> = {};
                    response.query.redirects?.forEach(r => {
                        redirectMap[r.from] = r.to;
                    });

                    Object.values(response.query.pages).forEach(page => {
                        if (page.imageinfo?.[0]) {
                            const canonicalTitle = page.title;
                            const canonicalName = canonicalTitle.replace(/^File:/, '');
                            const normalizedCanonicalName = normalizeFilename(canonicalName);

                            const info: ImageInfo = {
                                url: getProxiedImageUrl(page.imageinfo[0].url) || '',
                                user: page.imageinfo[0].user,
                                size: page.imageinfo[0].size,
                                width: page.imageinfo[0].width,
                                height: page.imageinfo[0].height,
                                canonicalName: normalizedCanonicalName
                            };

                            // Cache by canonical name
                            const canonicalCacheKey = `image_info:${normalizedCanonicalName}`;
                            this.cache.value[canonicalCacheKey] = {
                                data: [JSON.stringify(info)],
                                timestamp: Date.now()
                            };

                            chunk.forEach(originalName => {
                                const originalTitle = `File:${originalName}`;
                                const normOrig = normalizeFilename(originalName);
                                if (originalTitle === canonicalTitle || redirectMap[originalTitle] === canonicalTitle || normOrig === normalizedCanonicalName) {
                                    chunkResults[normOrig] = info;
                                    // Also cache by original requested name
                                    const origCacheKey = `image_info:${normOrig}`;
                                    this.cache.value[origCacheKey] = {
                                        data: [JSON.stringify(info)],
                                        timestamp: Date.now()
                                    };
                                }
                            });
                        }
                    });
                }

                chunk.forEach(originalName => {
                    const normKey = normalizeFilename(originalName);
                    const info = chunkResults[normKey] || null;
                    const cbs = callbacksMap.get(normKey);
                    if (cbs) {
                        cbs.forEach(cb => cb(info));
                    }
                    this.pendingImageInfoRequests.delete(normKey);
                });
            }
        } catch (error) {
            console.error('Failed to flush batch image info:', error);
            toFetch.forEach(filename => {
                const normKey = normalizeFilename(filename);
                const cbs = callbacksMap.get(normKey);
                if (cbs) {
                    cbs.forEach(cb => cb(null));
                }
                this.pendingImageInfoRequests.delete(normKey);
            });
        }
    }

    async getImagesInfo(filenames: string[]): Promise<Record<string, ImageInfo>> {
        if (!filenames.length) return {};

        const results: Record<string, ImageInfo> = {};
        const fetchPromises: Promise<{ key: string; info: ImageInfo | null }>[] = [];

        filenames.forEach(filename => {
            const key = normalizeFilename(filename);
            const cacheKey = `image_info:${key}`;
            const cached = this.cache.value[cacheKey];
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                try {
                    const info = JSON.parse(cached.data[0]);
                    info.url = getProxiedImageUrl(info.url) || '';
                    results[key] = info;
                } catch (e) {
                    fetchPromises.push(this.queueImageInfoFetch(filename).then(info => ({ key, info })));
                }
            } else {
                fetchPromises.push(this.queueImageInfoFetch(filename).then(info => ({ key, info })));
            }
        });

        if (fetchPromises.length > 0) {
            const fetched = await Promise.all(fetchPromises);
            fetched.forEach(({ key, info }) => {
                if (info) {
                    results[key] = info;
                }
            });
        }

        return results;
    }

    async fetchTemplateWikitext(templateType: 'singleplayer' | 'multiplayer' | 'unknown'): Promise<string | null> {
        const result = await this.fetchWikitext(`PCGamingWiki:Sample_article/Game_(${templateType})`, `template:${templateType}`);
        return result?.content || null;
    }

    async fetchWikitext(title: string, cacheKeyBase?: string, bypassCache: boolean = false): Promise<{ content: string; revid: number } | null> {
        const cacheKey = cacheKeyBase || `wikitext:${title}`;
        if (!bypassCache) {
            const cached = this.getFromCache(cacheKey);
            // If cached and cache is a simple string array (old format), we might need to handle it.
            // For simplicity, let's just clear cache or handle the new format.
            if (cached && cached.length >= 2) {
                return { content: cached[0], revid: parseInt(cached[1]) };
            }
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

            const rawContent = page?.revisions?.[0]?.slots?.main?.['*'];
            const revid = page?.revisions?.[0]?.revid;
            if (rawContent === undefined || revid === undefined) return null;

            const content = rawContent.replace(/\r\n/g, '\n');
            this.setCache(cacheKey, [content, revid.toString()]);
            // This response *is* the text of `revid`: keep it, so when this revision later becomes the
            // merge ancestor there is nothing left to fetch.
            void putRevisionText(revid, content);
            return { content, revid };
        } catch (error) {
            console.error(`Failed to fetch wikitext for ${title}:`, error);
            return null;
        }
    }

    // Wikitext of one specific revision — the true merge ancestor. Revisions are immutable, so this
    // is always cache-safe.
    async fetchRevisionWikitext(revid: number): Promise<string | null> {
        // Revisions are immutable, so this is cached in IndexedDB without expiry — after the first
        // look-up (usually already primed by the fetchWikitext that synced the page) the merge needs
        // no network at all. The generic localStorage cache is wrong here: it expires in 24h and these
        // strings are hundreds of KB.
        const stored = await getRevisionText(revid);
        if (stored !== null) return stored;

        try {
            const result = await this.fetchApi<{ query?: { pages?: Record<string, { revisions?: { slots?: { main?: { '*'?: string } } }[] }> } }>({
                action: 'query',
                prop: 'revisions',
                revids: String(revid),
                rvprop: 'content',
                rvslots: 'main',
            });

            const page = Object.values(result?.query?.pages || {})[0];
            const rawContent = page?.revisions?.[0]?.slots?.main?.['*'];
            if (rawContent === undefined) return null;

            const content = rawContent.replace(/\r\n/g, '\n');
            await putRevisionText(revid, content);
            return content;
        } catch (error) {
            console.error(`Failed to fetch wikitext for revision ${revid}:`, error);
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

    async getLatestRevisionsInfo(titles: string[]): Promise<Record<string, { revid: number }>> {
        const cleanTitles = Array.from(new Set(titles.filter(t => t.trim())));
        if (!cleanTitles.length) return {};

        const results: Record<string, { revid: number }> = {};

        try {
            // MediaWiki limits multi-title queries to 50 for standard users
            const CHUNK_SIZE = 50;
            for (let i = 0; i < cleanTitles.length; i += CHUNK_SIZE) {
                const chunk = cleanTitles.slice(i, i + CHUNK_SIZE);
                const response = await this.fetchApi<{ 
                    query?: { 
                        pages?: Record<string, { title: string; revisions?: { revid: number }[] }>,
                        normalized?: { from: string; to: string }[],
                        redirects?: { from: string; to: string }[]
                    } 
                }>({
                    action: 'query',
                    prop: 'revisions',
                    titles: chunk.join('|'),
                    rvprop: 'ids',
                    redirects: '1'
                });

                if (response?.query?.pages) {
                    const normalizedMap: Record<string, string> = {};
                    response.query.normalized?.forEach(n => {
                        normalizedMap[n.from] = n.to;
                    });

                    const redirectMap: Record<string, string> = {};
                    response.query.redirects?.forEach(r => {
                        redirectMap[r.from] = r.to;
                    });

                    const pagesByTitle: Record<string, { revid: number }> = {};
                    Object.values(response.query.pages).forEach(page => {
                        const revid = page.revisions?.[0]?.revid;
                        if (revid !== undefined) {
                            pagesByTitle[page.title] = { revid };
                        }
                    });

                    chunk.forEach(title => {
                        const normalized = normalizedMap[title] || title;
                        const target = redirectMap[normalized] || normalized;
                        const info = pagesByTitle[target];
                        if (info) {
                            results[title] = info;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to get batch revision info:', error);
        }

        return results;
    }

    extractTitleFromUrl(url: string): string | null {
        try {
            let cleanUrl = url.trim();
            if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                cleanUrl = 'https://' + cleanUrl;
            }
            const parsedUrl = new URL(cleanUrl);
            const hostname = parsedUrl.hostname.replace(/^www\./, '');
            if (hostname !== 'pcgamingwiki.com') return null;

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

    async prewarmCargoInitialValues(): Promise<void> {
        const fieldsMap: Record<string, string> = {
            'Developers': 'Game.Developers',
            'Publishers': 'Game.Publishers',
            'Engines': 'Game.Engines',
            'Series': 'Game.Series',
            'Genres': 'Game.Genres',
            'Themes': 'Game.Themes',
            'Perspectives': 'Game.Perspectives',
            'Pacing': 'Game.Pacing',
            'Controls': 'Game.Controls',
            'Sports': 'Game.Sports',
            'Vehicles': 'Game.Vehicles',
            'Art styles': 'Game.Art_styles',
            'Monetization': 'Game.Monetization',
            'Microtransactions': 'Game.Microtransactions',
            'Modes': 'Game.Modes'
        };

        const checkKey = 'cargo:Game.Genres:__initial__';
        if (this.getFromCache(checkKey)) {
            return;
        }

        // Cargo queries strictly require authentication with bot password on PCGamingWiki
        if (!pcgwAuth.isLoggedIn) {
            return;
        }

        try {
            const fieldsQueryList = [
                'Developers',
                'Publishers',
                'Engines',
                'Series',
                'Genres',
                'Themes',
                'Perspectives',
                'Pacing',
                'Controls',
                'Sports',
                'Vehicles',
                'Art_styles',
                'Monetization',
                'Microtransactions',
                'Modes'
            ].join(',');

            const queryParams: Record<string, string> = {
                action: 'cargoquery',
                tables: 'Game',
                fields: fieldsQueryList,
                order_by: 'Game._pageID DESC',
                limit: '500',
            };

            const result = await this.fetchApi<{ cargoquery?: { title: Record<string, string> }[] }>(queryParams, true);

            if (!result?.cargoquery || !Array.isArray(result.cargoquery)) {
                return;
            }

            const sets: Record<string, Set<string>> = {};
            Object.values(fieldsMap).forEach(field => {
                sets[field] = new Set<string>();
            });

            result.cargoquery.forEach((item) => {
                const title = item.title;
                if (!title) return;

                Object.entries(fieldsMap).forEach(([jsonKey, fieldName]) => {
                    const value = title[jsonKey];
                    if (value) {
                        value.split(',').forEach(v => {
                            let trimmed = v.trim();
                            trimmed = trimmed.replace(/^(Company|Engine|Series):/i, '');
                            
                            const lower = trimmed.toLowerCase();
                            if (lower === 'select...' || lower === 'select' || lower === 'search...' || !trimmed) {
                                return;
                            }
                            sets[fieldName].add(trimmed);
                        });
                    }
                });
            });

            Object.entries(sets).forEach(([fieldName, valSet]) => {
                const cacheKey = `cargo:${fieldName}:__initial__`;
                const suggestions = Array.from(valSet).slice(0, 50);
                if (suggestions.length > 0) {
                    this.setCache(cacheKey, suggestions);
                }
            });

            const commonSearches = [
                { field: 'Game.Developers', queries: ['Valve', 'EA', 'Ubisoft', 'Sony', 'Microsoft', 'Nintendo'] },
                { field: 'Game.Publishers', queries: ['Valve', 'EA', 'Ubisoft', 'Sony', 'Microsoft', 'Nintendo'] },
                { field: 'Game.Engines', queries: ['Unreal', 'Unity', 'Source', 'id Tech'] }
            ];

            commonSearches.forEach(({ field, queries }) => {
                const sourceSet = sets[field] || new Set<string>();
                const values = Array.from(sourceSet);
                queries.forEach(query => {
                    const cacheKey = `cargo:${field}:${query.toLowerCase()}`;
                    const matches = values
                        .filter(v => v.toLowerCase().includes(query.toLowerCase()))
                        .slice(0, 10);
                    if (matches.length > 0) {
                        this.setCache(cacheKey, matches);
                    }
                });
            });

        } catch (error) {
            console.error('Failed to prewarm Cargo initial values:', error);
        }
    }

    async prewarmCache(): Promise<void> {
        await this.prewarmCargoInitialValues().catch(console.warn);
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
