import { describe, it, expect } from 'vitest';
import {
    getSectionAnalysisFields,
    getSectionAnalysisPrompt,
    computeSectionComparisons,
    applySectionComparisons,
    type AnalysisSectionType
} from '../../../src/features/analysis/useSectionAnalysis';
import { 
    saveSectionAnalysisRecord, 
    getSavedSectionAnalysis, 
    deleteSavedSectionAnalysis 
} from '../../../src/db';
import { SettingsAudio, SettingsInput, SettingsNetwork, SettingsVideo } from '../../../src/models/GameData';

describe('useSectionAnalysis - Unified AI Analysis Engine', () => {
    describe('Schema-driven field extraction', () => {
        const sections: AnalysisSectionType[] = ['video', 'input', 'audio', 'network'];

        it.each(sections)('extracts non-empty field definitions for %s', (section) => {
            const fields = getSectionAnalysisFields(section);
            expect(fields.length).toBeGreaterThan(0);
            for (const field of fields) {
                expect(field.key).toBeTruthy();
                expect(field.label).toBeTruthy();
                expect(field.category).toBeTruthy();
            }
        });

        it('generates specific AI prompts for each section', () => {
            expect(getSectionAnalysisPrompt('video')).toContain('widescreenResolution');
            expect(getSectionAnalysisPrompt('input')).toContain('controllerSupport');
            expect(getSectionAnalysisPrompt('audio')).toContain('separateVolume');
            expect(getSectionAnalysisPrompt('network')).toContain('onlinePlay');
        });
    });

    describe('Audio Section Diff & Apply', () => {
        const baseAudio: SettingsAudio = {
            separateVolume: 'unknown',
            surroundSound: 'false',
            subtitles: 'true',
            closedCaptions: 'unknown',
            muteOnFocusLost: 'false',
            royaltyFree: 'unknown',
            eaxSupport: 'unknown',
            redBookCdAudio: 'unknown',
            generalMidiAudio: 'unknown'
        };

        it('computes changed, unchanged, and unknown diffs for audio', () => {
            const aiResult = {
                separateVolume: 'true' as const,     // changed (unknown -> true)
                surroundSound: 'false' as const,     // unchanged (false -> false)
                subtitles: 'true' as const,          // unchanged (true -> true)
                closedCaptions: 'true' as const,     // changed (unknown -> true)
                muteOnFocusLost: 'unknown' as const, // unknown
                _notes: {
                    separateVolume: 'Master, Music, SFX, Voice sliders',
                    subtitles: 'English, French, German'
                }
            };

            const comparisons = computeSectionComparisons('audio', baseAudio, aiResult);

            const sepVol = comparisons.find(c => c.fieldKey === 'separateVolume')!;
            expect(sepVol.status).toBe('changed');
            expect(sepVol.selected).toBe(true);
            expect(sepVol.proposedNotes).toBe('Master, Music, SFX, Voice sliders');

            const surround = comparisons.find(c => c.fieldKey === 'surroundSound')!;
            expect(surround.status).toBe('unchanged');
            expect(surround.selected).toBe(false);

            const subtitles = comparisons.find(c => c.fieldKey === 'subtitles')!;
            expect(subtitles.status).toBe('changed'); // notes changed
            expect(subtitles.proposedNotes).toBe('English, French, German');
        });

        it('selectively applies audio changes', () => {
            const aiResult = {
                separateVolume: 'true' as const,
                closedCaptions: 'true' as const,
                _notes: {
                    separateVolume: 'Master, SFX'
                }
            };

            const comparisons = computeSectionComparisons('audio', baseAudio, aiResult);
            // Deselect closedCaptions
            const cc = comparisons.find(c => c.fieldKey === 'closedCaptions')!;
            cc.selected = false;

            const updated = applySectionComparisons('audio', baseAudio, comparisons, aiResult);
            expect(updated.separateVolume).toBe('true');
            expect(updated.separateVolumeNotes).toBe('Master, SFX');
            expect(updated.closedCaptions).toBe('unknown'); // Not applied
        });
    });

    describe('Input Section Diff & Apply', () => {
        const baseInput: SettingsInput = {
            keyRemap: 'unknown',
            controllerSupport: 'true',
            hapticFeedback: 'false',
            invertMouseY: 'unknown',
            xboxPrompts: 'unknown',
            playstationPrompts: 'unknown'
        };

        it('computes diff and updates input settings', () => {
            const aiResult = {
                keyRemap: 'true' as const,
                controllerSupport: 'true' as const,
                hapticFeedback: 'true' as const,
                xboxPrompts: 'true' as const,
                _notes: {
                    keyRemap: 'Full keyboard remapping'
                }
            };

            const comparisons = computeSectionComparisons('input', baseInput, aiResult);
            const keyRemap = comparisons.find(c => c.fieldKey === 'keyRemap')!;
            expect(keyRemap.status).toBe('changed');
            expect(keyRemap.selected).toBe(true);

            const updated = applySectionComparisons('input', baseInput, comparisons, aiResult);
            expect(updated.keyRemap).toBe('true');
            expect(updated.keyRemapNotes).toBe('Full keyboard remapping');
            expect(updated.hapticFeedback).toBe('true');
        });
    });

    describe('Network Section Diff & Apply', () => {
        const baseNetwork: SettingsNetwork = {
            localPlay: 'unknown',
            lanPlay: 'unknown',
            onlinePlay: 'unknown',
            crossplay: 'false',
            matchmaking: 'unknown'
        };

        it('computes diff and updates network settings', () => {
            const aiResult = {
                onlinePlay: 'true' as const,
                crossplay: 'true' as const,
                matchmaking: 'true' as const,
                _notes: {
                    onlinePlay: 'Co-op up to 4 players'
                }
            };

            const comparisons = computeSectionComparisons('network', baseNetwork, aiResult);
            const online = comparisons.find(c => c.fieldKey === 'onlinePlay')!;
            expect(online.status).toBe('changed');

            const updated = applySectionComparisons('network', baseNetwork, comparisons, aiResult);
            expect(updated.onlinePlay).toBe('true');
            expect(updated.onlinePlayNotes).toBe('Co-op up to 4 players');
            expect(updated.crossplay).toBe('true');
            expect(updated.matchmaking).toBe('true');
        });
    });

    describe('IndexedDB Multi-Section Persistence', () => {
        it('isolates saved analysis per section on the same page', async () => {
            const pageId = 'game-multi-section-test';

            const videoRecord = {
                pageId,
                section: 'video' as const,
                imageBase64: 'data:image/png;base64,video_data',
                fileName: 'video_settings.png',
                result: { widescreenResolution: 'true' },
                timestamp: 1000
            };

            const audioRecord = {
                pageId,
                section: 'audio' as const,
                imageBase64: 'data:image/png;base64,audio_data',
                fileName: 'audio_settings.png',
                result: { separateVolume: 'true' },
                timestamp: 2000
            };

            const inputRecord = {
                pageId,
                section: 'input' as const,
                imageBase64: 'data:image/png;base64,input_data',
                fileName: 'controls.png',
                result: { keyRemap: 'true' },
                timestamp: 3000
            };

            await saveSectionAnalysisRecord(videoRecord);
            await saveSectionAnalysisRecord(audioRecord);
            await saveSectionAnalysisRecord(inputRecord);

            const loadedVideo = await getSavedSectionAnalysis(pageId, 'video');
            const loadedAudio = await getSavedSectionAnalysis(pageId, 'audio');
            const loadedInput = await getSavedSectionAnalysis(pageId, 'input');
            const loadedNetwork = await getSavedSectionAnalysis(pageId, 'network');

            expect(loadedVideo?.fileName).toBe('video_settings.png');
            expect(loadedAudio?.fileName).toBe('audio_settings.png');
            expect(loadedInput?.fileName).toBe('controls.png');
            expect(loadedNetwork).toBeNull();

            // Deleting audio leaves video and input untouched
            await deleteSavedSectionAnalysis(pageId, 'audio');
            expect(await getSavedSectionAnalysis(pageId, 'audio')).toBeNull();
            expect((await getSavedSectionAnalysis(pageId, 'video'))?.fileName).toBe('video_settings.png');
            expect((await getSavedSectionAnalysis(pageId, 'input'))?.fileName).toBe('controls.png');
        });
    });
});
