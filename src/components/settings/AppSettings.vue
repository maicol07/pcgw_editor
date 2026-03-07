<script setup lang="ts">
import { ref, inject, type Ref, watch } from 'vue';
import { useUiStore } from '../../stores/ui';
import Dialog from 'primevue/dialog';
import SelectButton from 'primevue/selectbutton';
import Select from 'primevue/select';
import Slider from 'primevue/slider';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { Palette, Bot, Sun, Moon, Monitor, Type, Layout, Key, AlignJustify, AlignLeft, Menu } from 'lucide-vue-next';

const uiStore = useUiStore();
const geminiApiKey = inject<Ref<string>>('geminiApiKey');
const apiKeyValue = ref(geminiApiKey?.value || '');

watch(() => uiStore.isSettingsOpen, (val) => {
    if (val) apiKeyValue.value = geminiApiKey?.value || '';
});

const themeOptions = [
    { label: 'System', value: 'system', icon: Monitor },
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon }
];

const fontOptions = [
    { label: 'Google Sans (Default)', value: '"Google Sans"' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Segoe UI Variable', value: '"Segoe UI Variable", "Segoe UI", sans-serif' },
    { label: 'Outfit', value: 'Outfit' },
    { label: 'Sora', value: 'Sora' },
    { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans"' },
    { label: 'Lexend', value: 'Lexend' },
    { label: 'Manrope', value: 'Manrope' },
    { label: 'Pixelify Sans', value: '"Pixelify Sans"' }
];

const densityModes = ['normal', 'comfortable', 'compact'] as const;
const densityLabels = ['Normal', 'Comfortable', 'Compact'];
const densityValue = ref(densityModes.indexOf(uiStore.densityMode));

const updateDensity = (val: number | number[]) => {
    const index = Array.isArray(val) ? val[0] : val;
    uiStore.densityMode = densityModes[index];
};

const saveSettings = () => {
    if (geminiApiKey) {
        geminiApiKey.value = apiKeyValue.value;
        localStorage.setItem('gemini-api-key', apiKeyValue.value);
    }
    uiStore.isSettingsOpen = false;
};
</script>

<template>
    <Dialog v-model:visible="uiStore.isSettingsOpen" modal header="App Settings" :style="{ width: '450px' }"
        :draggable="false" class="p-fluid glass">
        <template #header>
            <div class="flex items-center gap-2">
                <Palette class="w-5 h-5 text-primary-500" />
                <span class="font-bold text-lg">App Settings</span>
            </div>
        </template>

        <div class="flex flex-col gap-6 py-2">
            <!-- Appearance Group -->
            <div class="flex flex-col gap-4">
                <h3 class="text-sm font-bold uppercase tracking-wider text-surface-500 flex items-center gap-2">
                    <Palette class="w-4 h-4" /> Appearance
                </h3>

                <!-- Theme -->
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-700 dark:text-surface-200">Theme</label>
                    <SelectButton v-model="uiStore.theme" :options="themeOptions" optionLabel="label"
                        optionValue="value" dataKey="value" aria-labelledby="theme-select">
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <component :is="slotProps.option.icon" class="w-4 h-4" />
                                <span class="hidden sm:inline">{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </SelectButton>
                </div>

                <!-- Font Family -->
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-700 dark:text-surface-200 flex items-center gap-2">
                        <Type class="w-4 h-4" /> Font Family
                    </label>
                    <Select v-model="uiStore.fontFamily" :options="fontOptions" optionLabel="label" optionValue="value"
                        class="w-full" :style="{ fontFamily: uiStore.fontFamily }">
                        <template #value="slotProps">
                            <span :style="{ fontFamily: slotProps.value }">
                                {{fontOptions.find(o => o.value === slotProps.value)?.label || 'Select Font'}}
                            </span>
                        </template>
                        <template #option="slotProps">
                            <span :style="{ fontFamily: slotProps.option.value }">{{ slotProps.option.label }}</span>
                        </template>
                    </Select>
                </div>

                <!-- Density -->
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <label
                            class="text-sm font-medium text-surface-700 dark:text-surface-200 flex items-center gap-2">
                            <Layout class="w-4 h-4" /> UI Density
                        </label>
                        <span
                            class="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                            {{ densityLabels[densityValue] }}
                        </span>
                    </div>

                    <div class="px-2 pb-6 pt-2">
                        <Slider v-model="densityValue" :min="0" :max="2" :step="1" class="w-full"
                            @update:modelValue="updateDensity" />

                        <!-- Visual Segments & Icons -->
                        <div class="flex justify-between items-center mt-3 text-surface-400 relative">
                            <!-- Segment Markings -->
                            <div class="absolute w-full flex justify-between top-[-14px] px-[2px] pointer-events-none">
                                <div class="w-1 h-2 bg-surface-300 dark:bg-surface-600 rounded-full"></div>
                                <div class="w-1 h-2 bg-surface-300 dark:bg-surface-600 rounded-full"></div>
                                <div class="w-1 h-2 bg-surface-300 dark:bg-surface-600 rounded-full"></div>
                            </div>

                            <!-- Icons -->
                            <button @click="updateDensity(0); densityValue = 0"
                                class="flex flex-col items-center gap-1 hover:text-primary-500 transition-colors"
                                :class="{ 'text-primary-500': densityValue === 0 }">
                                <AlignJustify class="w-4 h-4" />
                            </button>
                            <button @click="updateDensity(1); densityValue = 1"
                                class="flex flex-col items-center gap-1 hover:text-primary-500 transition-colors"
                                :class="{ 'text-primary-500': densityValue === 1 }">
                                <AlignLeft class="w-4 h-4" />
                            </button>
                            <button @click="updateDensity(2); densityValue = 2"
                                class="flex flex-col items-center gap-1 hover:text-primary-500 transition-colors"
                                :class="{ 'text-primary-500': densityValue === 2 }">
                                <Menu class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <hr class="border-surface-200 dark:border-surface-700" />

            <!-- Integrations Group -->
            <div class="flex flex-col gap-4">
                <h3 class="text-sm font-bold uppercase tracking-wider text-surface-500 flex items-center gap-2">
                    <Bot class="w-4 h-4" /> Integrations
                </h3>

                <!-- Gemini API Key -->
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-700 dark:text-surface-200 flex items-center gap-2">
                        <Key class="w-4 h-4" /> Gemini API Key
                    </label>
                    <InputText v-model="apiKeyValue" type="password" placeholder="Enter your Gemini API Key"
                        class="w-full" />
                    <small class="text-surface-500">Required for AI screenshot analysis and automatic summaries.</small>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2 w-full">
                <Button label="Done" @click="saveSettings" icon="pi pi-check" />
            </div>
        </template>
    </Dialog>
</template>
