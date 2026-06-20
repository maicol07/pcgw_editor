<template>
    <div class="system-requirements-form">
        <Message severity="info" class="mb-4" :closable="false">
            System requirements should be populated for <b>all</b> supported operating systems.
        </Message>

        <div
            class="card bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden shadow-sm">
            <Tabs v-model:value="activeTab">
                <TabList class="bg-surface-50 dark:bg-surface-800/50 p-1 gap-1">
                    <Tab v-for="os in supportedOS" :key="os.key" :value="os.key"
                        class="rounded-lg px-4 py-2 transition-all duration-200">
                        <div class="flex items-center gap-2.5">
                            <img :src="os.icon" :alt="os.label" class="w-5 h-5 object-contain" />
                            <span class="font-medium">{{ os.label }}</span>
                        </div>
                    </Tab>
                </TabList>
                <TabPanels class="p-5">
                    <TabPanel v-for="os in supportedOS" :key="os.key" :value="os.key">
                        <div class="flex flex-col gap-6" v-if="localModel[os.key] && localModel[os.key].minimum">

                            <!-- Copy from first OS (non-primary tabs) -->
                            <div v-if="os.key !== supportedOS[0].key" class="flex justify-end -mb-2">
                                <Button :label="`Copy from ${supportedOS[0].label}`" size="small" text severity="secondary"
                                    @click="copyFromFirstOS(os.key)" v-tooltip.left="`Prefill from ${supportedOS[0].label} data`">
                                    <template #icon>
                                        <Copy class="w-3.5 h-3.5" />
                                    </template>
                                </Button>
                            </div>

                            <!-- Specs Grid -->
                            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <!-- Minimum Specs -->
                                <div
                                    class="flex flex-col gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/30 border border-surface-200 dark:border-surface-700/50">
                                    <div
                                        class="flex items-center gap-2 pb-2 border-b border-surface-200 dark:border-surface-700/50">
                                        <MinusCircle class="w-4 h-4 text-orange-500" />
                                        <h4
                                            class="font-bold text-sm uppercase tracking-wider text-surface-500 dark:text-surface-400">
                                            Minimum</h4>
                                    </div>

                                    <div class="space-y-4">
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-min-os`" class="text-xs font-semibold text-surface-500 uppercase">OS
                                                Version</label>
                                            <InputText :id="`sysreq-${os.key}-min-os`" v-model="localModel[os.key].minimum.os"
                                                placeholder="e.g. Windows 10 64-bit" size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-min-cpu`" class="text-xs font-semibold text-surface-500 uppercase">CPU</label>
                                            <InputText :id="`sysreq-${os.key}-min-cpu`" v-model="localModel[os.key].minimum.cpu"
                                                placeholder="e.g. Intel Core i5-4460" size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-min-ram`" class="text-xs font-semibold text-surface-500 uppercase">RAM</label>
                                            <InputText :id="`sysreq-${os.key}-min-ram`" v-model="localModel[os.key].minimum.ram" placeholder="e.g. 8 GB"
                                                size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-min-hdd`"
                                                class="text-xs font-semibold text-surface-500 uppercase">Storage</label>
                                            <InputText :id="`sysreq-${os.key}-min-hdd`" v-model="localModel[os.key].minimum.hdd" placeholder="e.g. 50 GB"
                                                size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-min-gpu`" class="text-xs font-semibold text-surface-500 uppercase">GPU</label>
                                            <InputText :id="`sysreq-${os.key}-min-gpu`" v-model="localModel[os.key].minimum.gpu"
                                                placeholder="e.g. NVIDIA GTX 960" size="small" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Recommended Specs -->
                                <div
                                    class="flex flex-col gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/30 border border-surface-200 dark:border-surface-700/50">
                                    <div
                                        class="flex items-center gap-2 pb-2 border-b border-surface-200 dark:border-surface-700/50">
                                        <PlusCircle class="w-4 h-4 text-green-500" />
                                        <h4
                                            class="font-bold text-sm uppercase tracking-wider text-surface-500 dark:text-surface-400">
                                            Recommended</h4>
                                        <Button label="Copy from Minimum" size="small" text severity="secondary"
                                            class="ml-auto px-2! py-1! text-xs!" @click="copyFromMinimum(os.key)"
                                            v-tooltip.top="'Copy all Minimum spec fields into Recommended'">
                                            <template #icon>
                                                <Copy class="w-3.5 h-3.5" />
                                            </template>
                                        </Button>
                                    </div>

                                    <div class="space-y-4">
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-rec-os`" class="text-xs font-semibold text-surface-500 uppercase">OS
                                                Version</label>
                                            <InputText :id="`sysreq-${os.key}-rec-os`" v-model="localModel[os.key].recommended.os"
                                                placeholder="e.g. Windows 11" size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-rec-cpu`" class="text-xs font-semibold text-surface-500 uppercase">CPU</label>
                                            <InputText :id="`sysreq-${os.key}-rec-cpu`" v-model="localModel[os.key].recommended.cpu"
                                                placeholder="e.g. Intel Core i7-8700" size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-rec-ram`" class="text-xs font-semibold text-surface-500 uppercase">RAM</label>
                                            <InputText :id="`sysreq-${os.key}-rec-ram`" v-model="localModel[os.key].recommended.ram"
                                                placeholder="e.g. 16 GB" size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-rec-hdd`"
                                                class="text-xs font-semibold text-surface-500 uppercase">Storage</label>
                                            <InputText :id="`sysreq-${os.key}-rec-hdd`" v-model="localModel[os.key].recommended.hdd"
                                                placeholder="e.g. 50 GB" size="small" />
                                        </div>
                                        <div class="grid gap-1.5">
                                            <label :for="`sysreq-${os.key}-rec-gpu`" class="text-xs font-semibold text-surface-500 uppercase">GPU</label>
                                            <InputText :id="`sysreq-${os.key}-rec-gpu`" v-model="localModel[os.key].recommended.gpu"
                                                placeholder="e.g. NVIDIA RTX 2060" size="small" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Notes -->
                            <div class="flex flex-col gap-2 pt-2 border-t border-surface-100 dark:border-surface-800">
                                <label :for="`sysreq-${os.key}-notes`" class="text-sm font-semibold flex items-center gap-2">
                                    <FileText class="w-4 h-4 text-primary-500" />
                                    Additional Notes
                                </label>
                                <Textarea :id="`sysreq-${os.key}-notes`" v-model="localModel[os.key].notes" rows="2"
                                    placeholder="e.g. AVX support required, constant internet connection..."
                                    class="w-full" autoResize />
                            </div>

                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { SystemRequirements, SystemRequirementsOS, SystemSpecs } from '../models/GameData';
import Message from 'primevue/message';
import Button from 'primevue/button';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { MinusCircle, PlusCircle, FileText, Copy } from 'lucide-vue-next';
import { useVModel } from '@vueuse/core';

// Icons
// @ts-ignore
import iconWindows from '../assets/icons/os-windows.svg';
// @ts-ignore
import iconMac from '../assets/icons/os-osx.svg';
// @ts-ignore
import iconLinux from '../assets/icons/os-linux.svg';

const props = defineProps<{
    modelValue: SystemRequirements;
}>();

const emit = defineEmits(['update:modelValue']);

// Use useVModel for deep reactivity and auto-sync
const localModel = useVModel(props, 'modelValue', emit, { deep: true });

// Initial structure check
watch(() => localModel.value, () => {
    if (!localModel.value || !localModel.value.windows) {
        initialize();
    }
}, { deep: true, immediate: true });

const activeTab = ref('windows');

const supportedOS = [
    { key: 'windows' as const, label: 'Windows', icon: iconWindows },
    { key: 'mac' as const, label: 'macOS', icon: iconMac },
    { key: 'linux' as const, label: 'Linux', icon: iconLinux },
];

const createEmptyOSReqs = (): SystemRequirementsOS => ({
    minimum: { os: '', cpu: '', ram: '', hdd: '', gpu: '' },
    recommended: { os: '', cpu: '', ram: '', hdd: '', gpu: '' }
});

// Initialization safety
const initialize = () => {
    // Ensure structure exists if undefined
    if (!localModel.value) {
        localModel.value = {
            windows: createEmptyOSReqs(),
            mac: createEmptyOSReqs(),
            linux: createEmptyOSReqs()
        };
        return;
    }

    // Check individual keys and their structure structure
    if (!localModel.value.windows || !localModel.value.windows.minimum) localModel.value.windows = createEmptyOSReqs();
    if (!localModel.value.mac || !localModel.value.mac.minimum) localModel.value.mac = createEmptyOSReqs();
    if (!localModel.value.linux || !localModel.value.linux.minimum) localModel.value.linux = createEmptyOSReqs();
};

type OSKey = 'windows' | 'mac' | 'linux';

// Copy all Minimum spec fields into Recommended for the given OS
const copyFromMinimum = (osKey: OSKey) => {
    const osReqs = localModel.value[osKey];
    if (!osReqs || !osReqs.minimum) return;
    osReqs.recommended = { ...osReqs.minimum } as SystemSpecs;
};

// Prefill an OS section from the first (primary) OS's data
const copyFromFirstOS = (osKey: OSKey) => {
    const sourceKey = supportedOS[0].key;
    if (osKey === sourceKey) return;
    const source = localModel.value[sourceKey];
    const target = localModel.value[osKey];
    if (!source || !target) return;
    target.minimum = { ...source.minimum } as SystemSpecs;
    target.recommended = { ...source.recommended } as SystemSpecs;
    if (source.notes !== undefined) target.notes = source.notes;
};

onMounted(() => {
    initialize();
});

// Watch for external replacement of the object (e.g. from async load) to re-ensure structure
watch(() => localModel.value, () => {
    // Only check structural integrity, useVModel handles values
    if (!localModel.value || !localModel.value.windows) {
        initialize();
    }
}, { deep: true });


</script>
