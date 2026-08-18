import { describe, it, expect, vi } from 'vitest';
import {
    computeVideoComparisons,
    applyVideoComparisons,
    type VideoAnalysisResult
} from '../../../src/features/video/useVideoAnalysis';
import { SettingsVideo } from '../../../src/models/GameData';

describe('VideoAnalysis diffing and apply logic', () => {
    const baseVideo: SettingsVideo = {
        widescreenResolution: 'unknown',
        multiMonitor: 'false',
        ultraWidescreen: 'true',
        fourKUltraHd: 'unknown',
        fov: 'false',
        windowed: 'true',
        borderlessWindowed: 'unknown',
        anisotropic: 'unknown',
        antiAliasing: 'false',
        upscaling: 'true',
        upscalingTech: 'DLSS 2',
        frameGen: 'false',
        vsync: 'unknown',
        fps60: 'true',
        fps120: 'false',
        hdr: 'unknown',
        rayTracing: 'false',
        colorBlind: 'unknown'
    };

    it('correctly categorizes changed, unchanged and unknown fields', () => {
        const aiResult: VideoAnalysisResult = {
            widescreenResolution: 'true', // changed (unknown -> true)
            multiMonitor: 'false',        // unchanged (false -> false)
            ultraWidescreen: 'true',      // unchanged (true -> true)
            fov: 'true',                  // changed (false -> true)
            windowed: 'true',             // unchanged (true -> true)
            antiAliasing: 'true',         // changed (false -> true)
            upscaling: 'true',
            upscalingTech: 'DLSS 3',      // changed (DLSS 2 -> DLSS 3)
            frameGen: 'false',            // unchanged (false -> false)
            fourKUltraHd: 'unknown',      // unknown
            _notes: {
                antiAliasing: 'MSAA 4x, TAA',
                fov: 'Range 70-110'
            }
        };

        const comparisons = computeVideoComparisons(baseVideo, aiResult);

        const widescreen = comparisons.find(c => c.fieldKey === 'widescreenResolution')!;
        expect(widescreen.status).toBe('changed');
        expect(widescreen.selected).toBe(true);
        expect(widescreen.currentValue).toBe('unknown');
        expect(widescreen.proposedValue).toBe('true');

        const multiMonitor = comparisons.find(c => c.fieldKey === 'multiMonitor')!;
        expect(multiMonitor.status).toBe('unchanged');
        expect(multiMonitor.selected).toBe(false);

        const upscaling = comparisons.find(c => c.fieldKey === 'upscaling')!;
        expect(upscaling.status).toBe('changed'); // tech changed from DLSS 2 to DLSS 3
        expect(upscaling.currentTech).toBe('DLSS 2');
        expect(upscaling.proposedTech).toBe('DLSS 3');
        expect(upscaling.selected).toBe(true);

        const fov = comparisons.find(c => c.fieldKey === 'fov')!;
        expect(fov.status).toBe('changed');
        expect(fov.proposedNotes).toBe('Range 70-110');

        const fourK = comparisons.find(c => c.fieldKey === 'fourKUltraHd')!;
        expect(fourK.status).toBe('unknown');
        expect(fourK.selected).toBe(false);
    });

    it('detects changes when notes are updated even if rating is identical', () => {
        const videoWithAA: SettingsVideo = {
            ...baseVideo,
            antiAliasing: 'true',
            antiAliasingNotes: 'FXAA'
        };

        const aiResult: VideoAnalysisResult = {
            antiAliasing: 'true',
            _notes: {
                antiAliasing: 'FXAA, TAA, DLAA'
            }
        };

        const comparisons = computeVideoComparisons(videoWithAA, aiResult);
        const aa = comparisons.find(c => c.fieldKey === 'antiAliasing')!;
        expect(aa.status).toBe('changed');
        expect(aa.selected).toBe(true);
        expect(aa.currentNotes).toBe('FXAA');
        expect(aa.proposedNotes).toBe('FXAA, TAA, DLAA');
    });

    it('applies only selected fields to target SettingsVideo', () => {
        const aiResult: VideoAnalysisResult = {
            widescreenResolution: 'true',
            fov: 'true',
            antiAliasing: 'true',
            upscaling: 'true',
            upscalingTech: 'DLSS 3',
            _notes: {
                fov: '70-110',
                antiAliasing: 'SMAA'
            }
        };

        const comparisons = computeVideoComparisons(baseVideo, aiResult);

        // Deselect fov manually
        const fovComp = comparisons.find(c => c.fieldKey === 'fov')!;
        fovComp.selected = false;

        const updated = applyVideoComparisons(baseVideo, comparisons, aiResult);

        // widescreen should be updated
        expect(updated.widescreenResolution).toBe('true');
        // fov should remain unchanged because it was deselected
        expect(updated.fov).toBe('false');
        expect(updated.fovNotes).toBeUndefined();
        // antiAliasing & notes should be updated
        expect(updated.antiAliasing).toBe('true');
        expect(updated.antiAliasingNotes).toBe('SMAA');
        // upscaling tech should be updated
        expect(updated.upscalingTech).toBe('DLSS 3');
    });

    it('dynamically loads field definitions from fieldsConfig schema', async () => {
        const { getVideoAnalysisFields } = await import('../../../src/features/video/useVideoAnalysis');
        const fields = getVideoAnalysisFields();

        expect(fields.length).toBeGreaterThan(10);
        // Verify key fields exist with labels and categories from fieldsConfig
        const widescreen = fields.find(f => f.key === 'widescreenResolution');
        expect(widescreen).toBeDefined();
        expect(widescreen?.label).toBe('Widescreen Resolution');
        expect(widescreen?.category).toBe('Resolution & Display');

        const upscaling = fields.find(f => f.key === 'upscaling');
        expect(upscaling).toBeDefined();
        expect(upscaling?.label).toBe('Upscaling');
        expect(upscaling?.category).toBe('Graphics Settings');
        expect(upscaling?.techField).toBe('upscalingTech');
        expect(upscaling?.notesField).toBe('upscalingNotes');
    });
});

