/**
 * PCGamingWiki Cargo API Service
 * Provides search and autocomplete functionality using Cargo tables with caching
 */

const API_BASE = 'https://www.pcgamingwiki.com/w/api.php';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = 'pcgw_api_cache';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface CargoResult {
    title: {
        [key: string]: string;
    };
}

interface StorageCache {
    [key: string]: CacheEntry<string[]>;
}

class PCGWApiService {
    private cache = new Map<string, CacheEntry<string[]>>();

    constructor() {
        // Load cache from localStorage on init
        this.loadCacheFromStorage();
    }

    /**
     * Make a request to PCGamingWiki Cargo API
     */
    private async fetchApi(params: Record<string, string>): Promise<any> {
        const urlParams = new URLSearchParams({
            format: 'json',
            origin: '*', // CORS
            ...params,
        });

        try {
            const response = await fetch(`${API_BASE}?${urlParams}`);
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('PCGamingWiki API error:', error);
            return null;
        }
    }

    /**
     * Load cache from localStorage
     */
    private loadCacheFromStorage(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            const storageCache: StorageCache = JSON.parse(stored);
            const now = Date.now();

            // Load only non-expired entries
            Object.entries(storageCache).forEach(([key, entry]) => {
                if (now - entry.timestamp < CACHE_DURATION) {
                    this.cache.set(key, entry);
                }
            });
        } catch (error) {
            console.warn('Failed to load cache from storage:', error);
        }
    }

    /**
     * Save cache to localStorage
     */
    private saveCacheToStorage(): void {
        try {
            const storageCache: StorageCache = {};
            this.cache.forEach((value, key) => {
                storageCache[key] = value;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storageCache));
        } catch (error) {
            console.warn('Failed to save cache to storage:', error);
        }
    }

    /**
     * Get from cache if valid, otherwise return null
     */
    private getFromCache(key: string): string[] | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
        if (isExpired) {
            this.cache.delete(key);
            this.saveCacheToStorage();
            return null;
        }

        return entry.data;
    }

    /**
     * Store in cache and save to localStorage
     */
    private setCache(key: string, data: string[]): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
        this.saveCacheToStorage();
    }

    /**
     * Query Cargo table for distinct values in a field
     */
    private async cargoQuery(field: string, searchTerm: string): Promise<string[]> {
        if (!searchTerm || searchTerm.length < 2) return [];

        const cacheKey = `cargo:${field}:${searchTerm.toLowerCase()}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        // Build Cargo query
        // We want distinct values from the field that contain the search term
        const params: Record<string, string> = {
            action: 'cargoquery',
            tables: 'Infobox_game',
            fields: `${field}=value`,
            where: `${field} HOLDS LIKE "%${searchTerm}%"`,
            group_by: field,
            limit: '20',
        };

        try {
            const result = await this.fetchApi(params);
            if (!result?.cargoquery || !Array.isArray(result.cargoquery)) {
                return [];
            }

            // Extract unique values from results
            const values = new Set<string>();
            result.cargoquery.forEach((item: CargoResult) => {
                const value = item.title?.value;
                if (value) {
                    // Cargo stores comma-separated values, so split them
                    value.split(',').forEach(v => {
                        let trimmed = v.trim();
                        // Remove namespace prefixes (e.g., "Company:" from "Company:Valve")
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

    /**
     * Search for companies (developers/publishers)
     */
    async searchCompanies(query: string): Promise<string[]> {
        // Try both Developers and Publishers fields
        const [devs, pubs] = await Promise.all([
            this.cargoQuery('Infobox_game.Developers', query),
            this.cargoQuery('Infobox_game.Publishers', query),
        ]);

        // Combine and dedupe
        const combined = new Set([...devs, ...pubs]);
        return Array.from(combined).slice(0, 10);
    }

    /**
     * Search for game engines
     */
    async searchEngines(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Engines', query);
    }

    /**
     * Search for game series/franchises
     */
    async searchSeries(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Series', query);
    }

    /**
     * Search for genres
     */
    async searchGenres(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Genres', query);
    }

    /**
     * Search for themes
     */
    async searchThemes(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Themes', query);
    }

    /**
     * Search for perspectives
     */
    async searchPerspectives(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Perspectives', query);
    }

    /**
     * Search for pacing types
     */
    async searchPacing(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Pacing', query);
    }

    /**
     * Search for control schemes
     */
    async searchControls(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Controls', query);
    }

    /**
     * Search for sports
     */
    async searchSports(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Sports', query);
    }

    /**
     * Search for vehicles
     */
    async searchVehicles(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Vehicles', query);
    }

    /**
     * Search for art styles
     */
    async searchArtStyles(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Art_styles', query);
    }

    /**
     * Search for monetization types
     */
    async searchMonetizations(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Monetizations', query);
    }

    /**
     * Search for microtransaction types
     */
    async searchMicrotransactions(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Microtransactions', query);
    }

    /**
     * Search for game modes
     */
    async searchModes(query: string): Promise<string[]> {
        return this.cargoQuery('Infobox_game.Modes', query);
    }

    /**
     * Search for files (images) on PCGW
     */
    async searchFiles(query: string): Promise<string[]> {
        if (!query || query.length < 2) return [];

        try {
            const result = await this.fetchApi({
                action: 'query',
                list: 'search',
                srsearch: query,
                srnamespace: '6', // File namespace
                srlimit: '10',
            });

            if (!result?.query?.search) return [];
            // Map titles and remove "File:" prefix for cleaner display
            return result.query.search.map((item: any) => item.title.replace(/^File:/, ''));
        } catch (error) {
            console.error('Failed to search files:', error);
            return [];
        }
    }

    /**
     * Pre-populate cache with common values
     */
    async prewarmCache(): Promise<void> {
        try {
            // Prewarm with popular searches
            const commonSearches = [
                { fn: this.searchCompanies.bind(this), queries: ['Valve', 'EA', 'Ubisoft', 'Sony', 'Microsoft', 'Nintendo'] },
                { fn: this.searchEngines.bind(this), queries: ['Unreal', 'Unity', 'Source', 'id Tech'] },
                { fn: this.searchSeries.bind(this), queries: ['Half-Life', 'Portal', 'Call of Duty'] },
            ];

            for (const { fn, queries } of commonSearches) {
                for (const query of queries) {
                    await fn(query);
                    // Small delay between requests to avoid overwhelming the API
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        } catch (error) {
            console.warn('Failed to prewarm cache:', error);
        }
    }

    /**
     * Get the actual URL for an uploaded image using MediaWiki API
     */
    async getImageUrl(filename: string): Promise<string | null> {
        if (!filename) return null;

        const cacheKey = `image:${filename}`;
        const cached = this.getFromCache(cacheKey);
        if (cached && cached.length > 0) return cached[0];

        try {
            const result = await this.fetchApi({
                action: 'query',
                titles: `File:${filename}`,
                prop: 'imageinfo',
                iiprop: 'url',
            });

            if (!result?.query?.pages) return null;

            // Get the first (and only) page
            const pages = Object.values(result.query.pages);
            const page = pages[0] as any;

            if (!page?.imageinfo?.[0]?.url) return null;

            const imageUrl = page.imageinfo[0].url;
            this.setCache(cacheKey, [imageUrl]);
            return imageUrl;
        } catch (error) {
            console.error('Failed to get image URL:', error);
            return null;
        }
    }

    /**
     * Clear all cached data
     */
    clearCache(): void {
        this.cache.clear();
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear storage cache:', error);
        }
    }
}

// Export singleton instance
export const pcgwApi = new PCGWApiService();

// Prewarm cache on module load (non-blocking)
setTimeout(() => {
    pcgwApi.prewarmCache().catch(console.warn);
}, 2000); // Wait 2s before prewarming
