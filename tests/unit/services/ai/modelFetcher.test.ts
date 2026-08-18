import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    getCachedModels,
    setCachedModels,
    fetchProviderModels,
    type AIModelOption,
} from '../../../../src/services/ai/modelFetcher';

describe('modelFetcher', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('cache functions', () => {
        it('returns null when cache is empty or invalid', () => {
            expect(getCachedModels('google')).toBeNull();
            localStorage.setItem('ai-models-cache-google', 'invalid-json');
            expect(getCachedModels('google')).toBeNull();
        });

        it('saves and retrieves cached models', () => {
            const sample: AIModelOption[] = [{ id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }];
            setCachedModels('google', sample);
            expect(getCachedModels('google')).toEqual(sample);
        });
    });

    describe('fetchProviderModels - Google', () => {
        it('throws if no API key is provided', async () => {
            await expect(fetchProviderModels('google', '')).rejects.toThrow(/No API key/);
        });

        it('parses Google models and filters generateContent and non-text models', async () => {
            const fakeResponse = {
                models: [
                    {
                        name: 'models/gemini-2.5-flash',
                        displayName: 'Gemini 2.5 Flash',
                        supportedGenerationMethods: ['generateContent', 'countTokens'],
                    },
                    {
                        name: 'models/imagen-3.0-generate-002',
                        displayName: 'Imagen 3',
                        supportedGenerationMethods: ['generateContent'],
                    },
                    {
                        name: 'models/text-embedding-004',
                        displayName: 'Text Embedding 004',
                        supportedGenerationMethods: ['embedContent'],
                    },
                ],
            };

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: async () => fakeResponse,
            }));

            const models = await fetchProviderModels('google', 'test-key');
            expect(models).toEqual([
                { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
            ]);
            expect(getCachedModels('google')).toEqual(models);
        });
    });

    describe('fetchProviderModels - OpenAI', () => {
        it('parses OpenAI models, filters text-only models, and sorts by created date', async () => {
            const fakeResponse = {
                data: [
                    { id: 'text-embedding-3-small', created: 100 },
                    { id: 'gpt-4o', created: 300 },
                    { id: 'gpt-4o-realtime-preview', created: 400 },
                    { id: 'dall-e-3', created: 450 },
                    { id: 'tts-1', created: 200 },
                    { id: 'o3-mini', created: 350 },
                ],
            };

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: async () => fakeResponse,
            }));

            const models = await fetchProviderModels('openai', 'sk-test');
            expect(models).toEqual([
                { id: 'o3-mini', label: 'o3-mini' },
                { id: 'gpt-4o', label: 'gpt-4o' },
            ]);
            expect(getCachedModels('openai')).toEqual(models);
        });
    });

    describe('fetchProviderModels - Anthropic', () => {
        it('parses Anthropic models and sorts by created_at', async () => {
            const fakeResponse = {
                data: [
                    {
                        id: 'claude-3-5-sonnet-20241022',
                        display_name: 'Claude 3.5 Sonnet',
                        created_at: '2024-10-22T00:00:00Z',
                    },
                    {
                        id: 'claude-3-7-sonnet-20250219',
                        display_name: 'Claude 3.7 Sonnet',
                        created_at: '2025-02-19T00:00:00Z',
                    },
                ],
            };

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: async () => fakeResponse,
            }));

            const models = await fetchProviderModels('anthropic', 'sk-ant-test');
            expect(models).toEqual([
                { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
                { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
            ]);
            expect(getCachedModels('anthropic')).toEqual(models);
        });
    });

    describe('fetch error handling', () => {
        it('throws formatted error on non-OK response', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => 'Invalid API key',
            }));

            await expect(fetchProviderModels('google', 'bad-key')).rejects.toThrow(/Google API error \(401\)/);
        });
    });
});
