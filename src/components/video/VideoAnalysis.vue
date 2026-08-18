<script setup lang="ts">
import { ref, computed } from 'vue';
import { SettingsVideo } from '../../models/GameData';
import Button from 'openvue/button';
import Dialog from 'openvue/dialog';
import Checkbox from 'openvue/checkbox';
import { 
  Upload, Sparkles as SparklesIcon, X, Check, ArrowRight, Info
} from '@lucide/vue';
// AIService is imported lazily at the call site: a static import pulls the three @ai-sdk
// providers (~700 kB) into the startup bundle for a feature many sessions never use.
import { hasActiveKey } from '../../services/ai/aiConfig';
import { 
  videoAnalysisSchema, 
  computeVideoComparisons, 
  applyVideoComparisons,
  type VideoAnalysisResult,
  type VideoFieldComparison
} from '../../features/video/useVideoAnalysis';
import { ratingMetadata, type RatingValue } from '../../utils/ratings';

const props = defineProps<{
  modelValue: SettingsVideo;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: SettingsVideo): void;
}>();

const isAnalyzing = ref(false);
const error = ref('');
const analysisSuccess = ref(false);
const showReviewDialog = ref(false);
const screenshotPreviewUrl = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const comparisons = ref<VideoFieldComparison[]>([]);
const lastResult = ref<VideoAnalysisResult | null>(null);
const activeFilter = ref<'all' | 'changed' | 'unchanged'>('all');
const appliedMessage = ref('');

const changedCount = computed(() => comparisons.value.filter(c => c.status === 'changed').length);
const unchangedCount = computed(() => comparisons.value.filter(c => c.status === 'unchanged').length);
const unknownCount = computed(() => comparisons.value.filter(c => c.status === 'unknown').length);
const selectedCount = computed(() => comparisons.value.filter(c => c.selected).length);

const filteredComparisons = computed(() => {
    if (activeFilter.value === 'changed') {
        return comparisons.value.filter(c => c.status === 'changed');
    }
    if (activeFilter.value === 'unchanged') {
        return comparisons.value.filter(c => c.status === 'unchanged');
    }
    return comparisons.value;
});

const isAllFilteredSelected = computed(() => {
    const selectable = filteredComparisons.value.filter(c => c.status !== 'unknown');
    return selectable.length > 0 && selectable.every(c => c.selected);
});

const toggleSelectAllInView = () => {
    const shouldSelect = !isAllFilteredSelected.value;
    filteredComparisons.value.forEach(c => {
        if (c.status !== 'unknown') {
            c.selected = shouldSelect;
        }
    });
};

const selectOnlyChanged = () => {
    comparisons.value.forEach(c => {
        c.selected = c.status === 'changed';
    });
};

const selectAll = () => {
    comparisons.value.forEach(c => {
        if (c.status !== 'unknown') {
            c.selected = true;
        }
    });
};

const deselectAll = () => {
    comparisons.value.forEach(c => {
        c.selected = false;
    });
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        await analyzeScreenshot(target.files[0]);
    }
    // Reset inputs
    if (target.value) target.value = '';
};

// Handle Paste Event
const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
                await analyzeScreenshot(blob);
            }
            break;
        }
    }
};

const analyzeScreenshot = async (file: File) => {
    if (!hasActiveKey()) {
        error.value = "AI API key not found. Please add it in Settings → Integrations.";
        return;
    }

    isAnalyzing.value = true;
    error.value = '';
    analysisSuccess.value = false;

    try {
        // Convert to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        screenshotPreviewUrl.value = base64;

        const prompt = `
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
                    "widescreenResolution": "optional note",
                    "fov": "optional note about slider range",
                    "antiAliasing": "list of AA modes found",
                    "upscaling": "list of upscalers found"
                }
            }
            For boolean fields, use 'true', 'false', or 'unknown' (string).
            Be conservative. If not visible, use 'unknown'.
        `;

        const { analyzeImageJSON } = await import('../../services/ai/AIService');
        const result = (await analyzeImageJSON(base64, videoAnalysisSchema, prompt)) as VideoAnalysisResult;
        
        lastResult.value = result;
        comparisons.value = computeVideoComparisons(props.modelValue, result);
        activeFilter.value = 'all';
        showReviewDialog.value = true;
        
    } catch (e: any) {
        console.error("Analysis failed:", e);
        error.value = `Analysis failed: ${e.message}`;
    } finally {
        isAnalyzing.value = false;
    }
};

const handleApply = () => {
    if (!lastResult.value) return;

    const count = selectedCount.value;
    const updated = applyVideoComparisons(props.modelValue, comparisons.value, lastResult.value);
    emit('update:modelValue', updated);

    appliedMessage.value = count === 1 
        ? '1 video setting updated from screenshot!' 
        : `${count} video settings updated from screenshot!`;
    analysisSuccess.value = true;
    showReviewDialog.value = false;
};

const getRatingMeta = (val: string) => {
    const v = (val || '').toLowerCase() as RatingValue;
    return ratingMetadata[v] || { label: val || 'Unknown', icon: '', description: '' };
};
</script>

<template>
  <div class="flex flex-col gap-6" @paste="handlePaste">
    
    <!-- AI Analysis Section -->
    <div v-if="hasActiveKey()" class="surface-card p-4 flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="p-2 rounded-md text-primary-600 dark:text-primary-400 bg-primary-500/10">
                    <SparklesIcon class="w-5 h-5" />
                </div>
                <div>
                   <h3 class="section-eyebrow text-xs">AI Screenshot Analysis</h3>
                   <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Paste or upload a settings screenshot to auto-fill</p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileChange" />
                
                <Button 
                    label="Analyze Image" 
                    size="small" 
                    @click="triggerFileInput" 
                    :loading="isAnalyzing"
                    :disabled="isAnalyzing"
                    severity="primary"
                    outlined
                >
                    <template #icon>
                        <Upload class="w-4 h-4 mr-2" />
                    </template>
                </Button>

                <Button
                    v-if="comparisons.length > 0"
                    label="Review Last Analysis"
                    size="small"
                    severity="secondary"
                    text
                    @click="showReviewDialog = true"
                />
            </div>
        </div>

        <!-- Analysis Feedback -->
        <Transition name="fade">
            <div v-if="error" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded flex items-center gap-2">
                <X class="w-3 h-3" />
                {{ error }}
            </div>
            <div v-else-if="analysisSuccess" class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded flex items-center gap-2">
                <SparklesIcon class="w-3 h-3" />
                {{ appliedMessage || 'Settings updated from screenshot!' }}
            </div>
        </Transition>
    </div>

    <!-- Fallback if no Key -->
    <div v-else class="surface-card p-3 flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
        <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded-md">
            <SparklesIcon class="w-4 h-4 text-surface-400" />
        </div>
        <span class="text-xs font-medium text-surface-500">Add Gemini API Key to enable AI screenshot analysis</span>
    </div>

    <!-- Review Dialog / Modal -->
    <Dialog 
        v-model:visible="showReviewDialog" 
        modal 
        header="AI Screenshot Changes Preview" 
        :draggable="false" 
        class="p-fluid w-full max-w-3xl mx-4"
    >
        <template #header>
            <div class="flex items-center gap-2">
                <SparklesIcon class="w-5 h-5 text-primary-500" />
                <div class="flex flex-col">
                    <span class="font-bold text-base sm:text-lg">AI Screenshot Changes Preview</span>
                    <span class="text-xs text-surface-500 font-normal">Choose which detected settings to apply to the video configuration</span>
                </div>
            </div>
        </template>

        <div class="flex flex-col gap-4 py-1">
            <!-- Top Summary Card with Image Thumbnail & Stats -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-surface-50 dark:bg-surface-900/50 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="flex items-center gap-3 min-w-0">
                    <img 
                        v-if="screenshotPreviewUrl" 
                        :src="screenshotPreviewUrl" 
                        alt="Screenshot thumbnail" 
                        class="w-14 h-14 object-cover rounded-md border border-surface-200 dark:border-surface-700 shrink-0 shadow-xs"
                    />
                    <div class="flex flex-col gap-1 min-w-0">
                        <span class="text-xs font-semibold text-surface-900 dark:text-surface-100">
                            Screenshot Analyzed
                        </span>
                        <div class="flex flex-wrap items-center gap-1.5 text-xs">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                <SparklesIcon class="w-3 h-3" />
                                {{ changedCount }} Changed
                            </span>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-surface-200/70 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                                <Check class="w-3 h-3" />
                                {{ unchangedCount }} Unchanged
                            </span>
                            <span v-if="unknownCount > 0" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-surface-400 dark:text-surface-500">
                                {{ unknownCount }} Not detected
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Quick Selection Presets -->
                <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <Button 
                        label="Changed only" 
                        size="small" 
                        severity="secondary" 
                        text 
                        class="text-xs h-7 px-2"
                        @click="selectOnlyChanged"
                    />
                    <Button 
                        label="All" 
                        size="small" 
                        severity="secondary" 
                        text 
                        class="text-xs h-7 px-2"
                        @click="selectAll"
                    />
                    <Button 
                        label="None" 
                        size="small" 
                        severity="secondary" 
                        text 
                        class="text-xs h-7 px-2"
                        @click="deselectAll"
                    />
                </div>
            </div>

            <!-- Notice banner explaining preview nature -->
            <div class="text-xs text-surface-600 dark:text-surface-300 flex items-center gap-2 bg-primary-50/60 dark:bg-primary-950/20 p-2.5 rounded-lg border border-primary-200/60 dark:border-primary-800/40">
                <Info class="w-4 h-4 shrink-0 text-primary-500" />
                <span>
                    This is a <strong>preview</strong>: no changes will be saved until you click <em>Apply</em>. You can select or deselect individual settings.
                </span>
            </div>

            <!-- Filter Controls Bar -->
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-900 rounded-lg border border-surface-200/80 dark:border-surface-800">
                    <button 
                        type="button"
                        class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        :class="activeFilter === 'all' ? 'bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-xs' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-200'"
                        @click="activeFilter = 'all'"
                    >
                        All ({{ comparisons.length }})
                    </button>
                    <button 
                        type="button"
                        class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                        :class="activeFilter === 'changed' ? 'bg-surface-0 dark:bg-surface-800 text-green-600 dark:text-green-400 shadow-xs' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-200'"
                        @click="activeFilter = 'changed'"
                    >
                        <span>Changed</span>
                        <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-green-500/15 text-green-600 dark:text-green-400 font-bold">
                            {{ changedCount }}
                        </span>
                    </button>
                    <button 
                        type="button"
                        class="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        :class="activeFilter === 'unchanged' ? 'bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-xs' : 'text-surface-500 hover:text-surface-900 dark:hover:text-surface-200'"
                        @click="activeFilter = 'unchanged'"
                    >
                        Unchanged ({{ unchangedCount }})
                    </button>
                </div>

                <span class="text-xs text-surface-500">
                    {{ selectedCount }} of {{ comparisons.length }} selected
                </span>
            </div>

            <!-- Comparison Table -->
            <div class="border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 font-semibold text-surface-500 dark:text-surface-400 sticky top-0 z-10">
                            <th class="p-3 w-10">
                                <Checkbox 
                                    :modelValue="isAllFilteredSelected" 
                                    :binary="true" 
                                    @change="toggleSelectAllInView" 
                                />
                            </th>
                            <th class="p-3">Setting</th>
                            <th class="p-3">Current</th>
                            <th class="p-3 w-6 text-center"></th>
                            <th class="p-3">Proposed (AI)</th>
                            <th class="p-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="row in filteredComparisons" 
                            :key="row.fieldKey"
                            class="border-b last:border-0 border-surface-100 dark:border-surface-800 hover:bg-surface-50/50 dark:hover:bg-surface-800/10 transition-colors"
                            :class="{ 
                                'bg-green-500/5 dark:bg-green-950/10': row.status === 'changed',
                                'opacity-50 saturate-50 dark:opacity-40': row.status === 'unchanged' || row.status === 'unknown'
                            }"
                        >
                            <!-- Checkbox -->
                            <td class="p-3">
                                <Checkbox 
                                    v-model="row.selected" 
                                    :binary="true" 
                                    :disabled="row.status === 'unknown'" 
                                />
                            </td>

                            <!-- Setting Label & Category -->
                            <td class="p-3">
                                <div class="flex flex-col gap-0.5">
                                    <span class="font-medium text-surface-900 dark:text-surface-100">
                                        {{ row.label }}
                                    </span>
                                    <span class="text-[10px] text-surface-400 font-medium">
                                        {{ row.category }}
                                    </span>
                                </div>
                            </td>

                            <!-- Current Value -->
                            <td class="p-3 max-w-[150px]">
                                <div class="flex flex-col gap-1">
                                    <div class="flex items-center gap-1.5">
                                        <img 
                                            v-if="getRatingMeta(row.currentValue).icon" 
                                            :src="getRatingMeta(row.currentValue).icon" 
                                            :alt="row.currentValue" 
                                            class="w-4 h-4 shrink-0 object-contain"
                                        />
                                        <span class="text-surface-700 dark:text-surface-300 font-medium">
                                            {{ getRatingMeta(row.currentValue).label }}
                                        </span>
                                    </div>
                                    <div v-if="row.currentTech" class="text-[11px] text-surface-500 font-mono">
                                        {{ row.currentTech }}
                                    </div>
                                    <div v-if="row.currentNotes" class="text-[11px] text-surface-400 italic truncate" :title="row.currentNotes">
                                        {{ row.currentNotes }}
                                    </div>
                                </div>
                            </td>

                            <!-- Arrow -->
                            <td class="p-3 text-center text-surface-400">
                                <ArrowRight class="w-3.5 h-3.5 mx-auto" />
                            </td>

                            <!-- Proposed Value -->
                            <td class="p-3 max-w-[200px]">
                                <div class="flex flex-col gap-1">
                                    <template v-if="row.status !== 'unknown'">
                                        <div class="flex items-center gap-1.5">
                                            <img 
                                                v-if="getRatingMeta(row.proposedValue).icon" 
                                                :src="getRatingMeta(row.proposedValue).icon" 
                                                :alt="row.proposedValue" 
                                                class="w-4 h-4 shrink-0 object-contain"
                                            />
                                            <span 
                                                class="font-semibold"
                                                :class="row.status === 'changed' ? 'text-green-600 dark:text-green-400' : 'text-surface-700 dark:text-surface-300'"
                                            >
                                                {{ getRatingMeta(row.proposedValue).label }}
                                            </span>
                                        </div>

                                        <div v-if="row.proposedTech" class="inline-flex">
                                            <span class="px-1.5 py-0.2 text-[10px] font-mono rounded bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-semibold">
                                                {{ row.proposedTech }}
                                            </span>
                                        </div>

                                        <div v-if="row.proposedNotes" class="text-[11px] text-surface-600 dark:text-surface-400 italic truncate" :title="row.proposedNotes">
                                            Note: {{ row.proposedNotes }}
                                        </div>
                                    </template>
                                    <template v-else>
                                        <span class="text-surface-400 italic">Not detected</span>
                                    </template>
                                </div>
                            </td>

                            <!-- Status Badge -->
                            <td class="p-3 text-right">
                                <span 
                                    v-if="row.status === 'changed'"
                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30"
                                >
                                    <SparklesIcon class="w-2.5 h-2.5" />
                                    Changed
                                </span>
                                <span 
                                    v-else-if="row.status === 'unchanged'"
                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-100 dark:bg-surface-800 text-surface-500 border border-surface-200 dark:border-surface-700"
                                >
                                    <Check class="w-2.5 h-2.5" />
                                    Unchanged
                                </span>
                                <span 
                                    v-else
                                    class="text-surface-400 text-[11px] italic"
                                >
                                    &mdash;
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <template #footer>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
                <span class="text-xs text-surface-500 text-center sm:text-left">
                    {{ selectedCount }} changes selected to apply
                </span>
                <div class="flex flex-wrap items-center justify-end gap-2">
                    <Button 
                        label="Discard / Cancel" 
                        severity="secondary" 
                        text 
                        @click="showReviewDialog = false" 
                    />
                    <Button 
                        :label="`Apply Selected (${selectedCount})`" 
                        icon="pi pi-check" 
                        severity="primary"
                        :disabled="selectedCount === 0"
                        @click="handleApply" 
                    />
                </div>
            </div>
        </template>
    </Dialog>
  </div>
</template>

