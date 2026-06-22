<script setup lang="ts">
import { SectionDefinition } from '../../types/schema';
import DynamicField from './DynamicField.vue';

const props = defineProps<{
    section: SectionDefinition;
    modelValue: Record<string, any>;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, any>): void;
}>();

const getDeep = (obj: any, path: string) => {
    if (!path.includes('.')) return obj[path];
    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

const updateDeep = (obj: any, path: string, value: any): any => {
    const parts = path.split('.');
    const key = parts[0];
    if (parts.length === 1) {
        return { ...obj, [key]: value };
    }
    return {
        ...obj,
        [key]: updateDeep(obj[key] || {}, parts.slice(1).join('.'), value)
    };
};

const handleFieldUpdate = (key: string, value: any) => {
    const newState = updateDeep(props.modelValue, key, value);
    emit('update:modelValue', newState);
};

// Collapsible state
import { ref, inject } from 'vue';
import { ChevronDown, Sparkles } from 'lucide-vue-next';
import Button from 'primevue/button';

const collapsedGroups = ref<Record<number, boolean>>({});

const toggleGroup = (idx: number) => {
    collapsedGroups.value[idx] = !collapsedGroups.value[idx];
};

const openAutofillDialog = inject<(() => void) | undefined>('openAutofillDialog', undefined);

</script>

<template>
    <div class="dynamic-section @container flex flex-col gap-6">
        <!-- Top-level Fields -->
        <div v-if="section.fields && section.fields.length > 0" class="p-5 gap-6" :class="{
            'flex flex-col': !section.gridCols,
            'grid grid-cols-1': !!section.gridCols,
            '@md:grid-cols-2': section.gridCols === 2,
            '@md:grid-cols-2 @3xl:grid-cols-3': section.gridCols === 3
        }">
            <template v-for="field in section.fields" :key="field.key">
                <DynamicField v-memo="[modelValue[field.key], field.key]" :field="field"
                    :modelValue="getDeep(modelValue, field.key)" :formModel="modelValue"
                    @update:modelValue="(val) => handleFieldUpdate(field.key, val)" :class="{
                        'col-span-1': true,
                        '@md:col-span-2': field.colSpan === 2,
                        '@3xl:col-span-3': field.colSpan === 3
                    }" />
            </template>
        </div>

        <!-- Groups -->
        <div v-if="section.groups && section.groups.length > 0">
            <div class="flex flex-col gap-6">
                <div v-for="(group, idx) in section.groups" :key="idx"
                    class="@container border border-surface-200 dark:border-surface-800 rounded-md overflow-hidden transition-all duration-200">
                    <div @click="toggleGroup(idx)"
                        role="button"
                        tabindex="0"
                        @keydown.enter.prevent="toggleGroup(idx)"
                        @keydown.space.prevent="toggleGroup(idx)"
                        :aria-expanded="!collapsedGroups[idx]"
                        :aria-controls="`group-panel-${idx}`"
                        class="px-4 py-3 border-b border-surface-200/60 dark:border-surface-700/45 flex items-center justify-between cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors select-none group"
                        :class="{ 'border-b-0': collapsedGroups[idx] }">
                        <div class="flex items-center gap-3 text-surface-900 dark:text-surface-100">
                            <component :is="group.icon"
                                class="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors"
                                :class="group.iconClass" v-if="group.icon" />
                            <span class="section-eyebrow text-xs">{{ group.title }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Button 
                                v-if="openAutofillDialog && ['Reception', 'External Links'].includes(group.title)"
                                severity="secondary" 
                                text 
                                size="small" 
                                class="h-7 py-0 px-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors mr-1.5 text-surface-600 dark:text-surface-300 border border-surface-250 dark:border-surface-700 bg-surface-0/60 dark:bg-surface-900/40"
                                @click.stop="openAutofillDialog()"
                                v-tooltip.top="'Autofill links and scores using IGDB, Steam & Gemini AI'"
                            >
                                <Sparkles class="w-3 h-3 text-primary-500 animate-pulse shrink-0" />
                                <span>Autofill</span>
                            </Button>
                            <ChevronDown
                                class="w-5 h-5 text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300 transition-transform duration-200"
                                :class="{ '-rotate-90': collapsedGroups[idx] }" />
                        </div>
                    </div>

                    <div :id="`group-panel-${idx}`" class="grid transition-all duration-300 ease-in-out"
                        :class="collapsedGroups[idx] ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'">
                        <div class="overflow-hidden">
                            <div class="p-5" :class="{
                                'flex flex-col gap-5': !group.gridCols,
                                'grid grid-cols-1 gap-5': !!group.gridCols && typeof group.gridCols === 'number',
                                '@md:grid-cols-2': group.gridCols === 2,
                                '@md:grid-cols-2 @3xl:grid-cols-3': group.gridCols === 3,
                                'grid gap-5': typeof group.gridCols === 'string'
                            }"
                                :style="typeof group.gridCols === 'string' ? { gridTemplateColumns: group.gridCols } : {}">
                                <template v-for="field in group.fields" :key="field.key">
                                    <DynamicField v-memo="[modelValue[field.key], field.key]" :field="field"
                                        :modelValue="getDeep(modelValue, field.key)" :formModel="modelValue"
                                        @update:modelValue="(val) => handleFieldUpdate(field.key, val)" :class="{
                                            'col-span-1': true,
                                            '@md:col-span-2': field.colSpan === 2,
                                            '@3xl:col-span-3': field.colSpan === 3
                                        }" />
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
