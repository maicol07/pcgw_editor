import { z } from 'zod';
import { fieldsConfig } from '../../config/fields';
import { subFieldOf } from '../../types/schema';

export type AnalysisSectionType = 'video' | 'input' | 'audio' | 'network';

export interface AnalysisFieldDef {
    key: string;
    label: string;
    category: string;
    component: string;
    techField?: string;
    notesField?: string;
}

export interface FieldComparison {
    fieldKey: string;
    label: string;
    category: string;
    currentValue: string;
    proposedValue: string;
    currentTech?: string;
    proposedTech?: string;
    currentNotes?: string;
    proposedNotes?: string;
    status: 'changed' | 'unchanged' | 'unknown';
    selected: boolean;
}

export const sectionAnalysisSchema = z.record(z.string(), z.any());

export type SectionAnalysisResult = Record<string, any>;

export function getSectionAnalysisFields(sectionId: string): AnalysisFieldDef[] {
    const section = fieldsConfig.find(s => s.id === sectionId);
    if (!section) return [];

    const fieldDefs: AnalysisFieldDef[] = [];
    const groups = section.groups || [];

    for (const group of groups) {
        for (const field of group.fields) {
            const prefix = `${sectionId}.`;
            const rawKey = field.key.startsWith(prefix) ? field.key.slice(prefix.length) : field.key;
            const propKey = subFieldOf(field) || rawKey;

            if (field.component === 'CompoundRatingField') {
                const notesKey = `${propKey}Notes`;
                let techKey: string | undefined;
                if (sectionId === 'video') {
                    if (propKey === 'upscaling') techKey = 'upscalingTech';
                    if (propKey === 'frameGen') techKey = 'frameGenTech';
                }

                fieldDefs.push({
                    key: propKey,
                    label: field.label,
                    category: group.title,
                    component: field.component,
                    techField: techKey,
                    notesField: notesKey
                });
            }
        }
    }

    return fieldDefs;
}

export function getSectionAnalysisPrompt(sectionId: AnalysisSectionType): string {
    switch (sectionId) {
        case 'video':
            return `
Analyze this game settings screenshot (video/graphics).
Extract the following settings:
- Resolution support (widescreen, 4k, ultra-widescreen)
- Window modes (windowed, borderless)
- Field of View (FOV) slider presence
- Anti-aliasing (AA) types (MSAA, FXAA, TAA, etc.)
- Anisotropic Filtering (AF)
- VSync
- Frame rate limits (60, 120+, unlimited)
- HDR
- Ray Tracing
- Upscaling (DLSS, FSR, XeSS) and Frame Generation
- Color blind mode

Return JSON ONLY. Format:
{
  "widescreenResolution": "true/false/unknown",
  "multiMonitor": "true/false/unknown",
  "ultraWidescreen": "true/false/unknown",
  "fourKUltraHd": "true/false/unknown",
  "fov": "true/false/unknown",
  "windowed": "true/false/unknown",
  "borderlessWindowed": "true/false/unknown",
  "anisotropic": "true/false/unknown",
  "antiAliasing": "true/false/unknown",
  "upscaling": "true/false/unknown",
  "upscalingTech": "string (e.g. DLSS 2, FSR 2)",
  "frameGen": "true/false/unknown",
  "frameGenTech": "string (e.g. DLSS 3)",
  "vsync": "true/false/unknown",
  "fps60": "true/false/unknown",
  "fps120": "true/false/unknown",
  "hdr": "true/false/unknown",
  "rayTracing": "true/false/unknown",
  "colorBlind": "true/false/unknown",
  "_notes": {
    "fov": "optional slider range note",
    "antiAliasing": "optional AA types found",
    "upscaling": "optional upscalers found"
  }
}
For boolean fields, use 'true', 'false', or 'unknown' (string).
Be conservative. If not visible, use 'unknown'.`;

        case 'input':
            return `
Analyze this game settings screenshot (controls / input / keybindings / gamepad).
Extract the following settings:
- Key remapping (can keyboard keys be rebound?)
- Keyboard/Mouse button prompts in UI
- Mouse sensitivity slider
- Mouse menu navigation
- Invert mouse Y-axis
- Touchscreen support
- Controller support & full controller support
- Controller remapping & sensitivity
- Invert controller Y-axis
- Controller hotplugging
- Haptic feedback / vibration
- Simultaneous input (controller + mouse/keyboard at same time)
- Mouse acceleration option
- Controller prompts and controller support (Xbox, PlayStation, Nintendo, DirectInput, Steam Input)
- Input prompt override option

Return JSON ONLY. Format:
{
  "keyRemap": "true/false/unknown",
  "keyboardMousePrompts": "true/false/unknown",
  "mouseSensitivity": "true/false/unknown",
  "mouseMenu": "true/false/unknown",
  "invertMouseY": "true/false/unknown",
  "touchscreen": "true/false/unknown",
  "controllerSupport": "true/false/unknown",
  "fullController": "true/false/unknown",
  "controllerRemap": "true/false/unknown",
  "controllerSensitivity": "true/false/unknown",
  "invertControllerY": "true/false/unknown",
  "controllerHotplug": "true/false/unknown",
  "hapticFeedback": "true/false/unknown",
  "simultaneousInput": "true/false/unknown",
  "accelerationOption": "true/false/unknown",
  "xinputControllers": "true/false/unknown",
  "xboxPrompts": "true/false/unknown",
  "directInputControllers": "true/false/unknown",
  "directInputPrompts": "true/false/unknown",
  "playstationControllers": "true/false/unknown",
  "playstationPrompts": "true/false/unknown",
  "nintendoControllers": "true/false/unknown",
  "nintendoPrompts": "true/false/unknown",
  "steamInputApi": "true/false/unknown",
  "inputPromptOverride": "true/false/unknown",
  "_notes": {
    "keyRemap": "optional note",
    "controllerSupport": "optional note"
  }
}
For boolean fields, use 'true', 'false', or 'unknown' (string).
Be conservative. If not visible, use 'unknown'.`;

        case 'audio':
            return `
Analyze this game settings screenshot (audio / sound / subtitles / volume).
Extract the following settings:
- Separate volume controls (Master, Music, SFX/Effects, Voice/Dialogue sliders)
- Surround sound support (5.1, 7.1, 3D spatial audio)
- Subtitles toggle or subtitle presence
- Closed captions (sound effects and ambient subtitles)
- Mute on focus lost (mute when alt-tabbed / background)
- Royalty free audio / streamer mode

Return JSON ONLY. Format:
{
  "separateVolume": "true/false/unknown",
  "surroundSound": "true/false/unknown",
  "subtitles": "true/false/unknown",
  "closedCaptions": "true/false/unknown",
  "muteOnFocusLost": "true/false/unknown",
  "royaltyFree": "true/false/unknown",
  "eaxSupport": "true/false/unknown",
  "redBookCdAudio": "true/false/unknown",
  "generalMidiAudio": "true/false/unknown",
  "_notes": {
    "separateVolume": "optional note listing available volume sliders",
    "subtitles": "optional note on subtitle options"
  }
}
For boolean fields, use 'true', 'false', or 'unknown' (string).
Be conservative. If not visible, use 'unknown'.`;

        case 'network':
            return `
Analyze this game settings screenshot (multiplayer / network / connectivity).
Extract the following settings:
- Local play (split-screen / shared screen / hotseat)
- LAN play
- Online play / multiplayer
- Asynchronous multiplayer
- Crossplay (cross-platform multiplayer)
- Matchmaking / dedicated servers / peer-to-peer / self-hosting / direct IP
- UPnP support

Return JSON ONLY. Format:
{
  "localPlay": "true/false/unknown",
  "lanPlay": "true/false/unknown",
  "onlinePlay": "true/false/unknown",
  "asynchronous": "true/false/unknown",
  "crossplay": "true/false/unknown",
  "matchmaking": "true/false/unknown",
  "p2p": "true/false/unknown",
  "dedicated": "true/false/unknown",
  "selfHosting": "true/false/unknown",
  "directIp": "true/false/unknown",
  "upnp": "true/false/unknown",
  "_notes": {
    "onlinePlay": "optional note about multiplayer modes",
    "crossplay": "optional note about crossplay platforms"
  }
}
For boolean fields, use 'true', 'false', or 'unknown' (string).
Be conservative. If not visible, use 'unknown'.`;
    }
}

export function computeSectionComparisons(
    sectionId: string,
    current: Record<string, any>,
    aiResult: SectionAnalysisResult,
    fields: AnalysisFieldDef[] = getSectionAnalysisFields(sectionId)
): FieldComparison[] {
    const comparisons: FieldComparison[] = [];

    for (const field of fields) {
        const currentVal = (current[field.key] as string) || 'unknown';
        const proposedVal = (aiResult[field.key] as string) || 'unknown';

        let currentTech: string | undefined;
        let proposedTech: string | undefined;
        if (field.techField) {
            currentTech = (current[field.techField] as string) || undefined;
            proposedTech = (aiResult[field.techField] as string) || undefined;
        }

        let currentNotes: string | undefined;
        let proposedNotes: string | undefined;
        if (field.notesField) {
            currentNotes = (current[field.notesField] as string) || undefined;
            proposedNotes = aiResult._notes?.[field.key] || undefined;
        }

        const isProposedValidRating = proposedVal === 'true' || proposedVal === 'false';
        const hasProposedTech = !!(proposedTech && proposedTech.trim());
        const hasProposedNotes = !!(proposedNotes && proposedNotes.trim());

        let status: 'changed' | 'unchanged' | 'unknown' = 'unknown';

        if (isProposedValidRating || hasProposedTech || hasProposedNotes) {
            const valChanged = isProposedValidRating && proposedVal !== currentVal;
            const techChanged = hasProposedTech && proposedTech !== currentTech;
            const notesChanged = hasProposedNotes && proposedNotes !== currentNotes;

            if (valChanged || techChanged || notesChanged) {
                status = 'changed';
            } else {
                status = 'unchanged';
            }
        } else {
            status = 'unknown';
        }

        comparisons.push({
            fieldKey: field.key,
            label: field.label,
            category: field.category,
            currentValue: currentVal,
            proposedValue: proposedVal,
            currentTech,
            proposedTech,
            currentNotes,
            proposedNotes,
            status,
            selected: status === 'changed'
        });
    }

    return comparisons;
}

export function applySectionComparisons<T extends Record<string, any>>(
    sectionId: string,
    current: T,
    comparisons: FieldComparison[],
    _aiResult?: SectionAnalysisResult
): T {
    const updated = { ...current };
    const fieldDefs = getSectionAnalysisFields(sectionId);
    const defMap = new Map(fieldDefs.map(f => [f.key, f]));

    for (const comp of comparisons) {
        if (!comp.selected) continue;

        const fieldDef = defMap.get(comp.fieldKey);
        if (!fieldDef) continue;

        if (comp.proposedValue === 'true' || comp.proposedValue === 'false') {
            (updated as any)[fieldDef.key] = comp.proposedValue;
        }

        if (fieldDef.techField && comp.proposedTech) {
            (updated as any)[fieldDef.techField] = comp.proposedTech;
        }

        if (fieldDef.notesField && comp.proposedNotes) {
            (updated as any)[fieldDef.notesField] = comp.proposedNotes;
        }
    }

    return updated;
}
