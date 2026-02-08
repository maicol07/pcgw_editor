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

const setDeep = (obj: any, path: string, value: any) => {
    if (!path.includes('.')) {
        obj[path] = value;
        return obj;
    }
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        // We need to clone objects as we go to avoid mutation if props are readonly, 
        // but here we are mutating a clone of top level?
        // Actually, we should clone the whole state or use structuredClone.
        // For simplicity, we assume we can mutate the structuredClone we make at start.
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    return obj;
};

const handleFieldUpdate = (key: string, value: any) => {
    // Clone logic for immutability
    // structuredClone can fail on proxies even with toRaw if nested objects are proxies
    // Using simple spread for top level since we use setDeep which mutates?
    // Actually setDeep mutates. We need a deep clone.
    // Try JSON clone which is safe for data objects (removes functions/symbols)
    try {
        const newState = JSON.parse(JSON.stringify(props.modelValue));
        setDeep(newState, key, value);
        emit('update:modelValue', newState);
    } catch (e) {
        console.error('Failed to clone modelValue', e);
        // Fallback: shallow clone + modify? or emit value directly?
        // If clone fails, we can't ensure immutability, but we must try to emit.
        // Let's assume shallow clone for now if deep fails.
        const newState = { ...props.modelValue };
        setDeep(newState, key, value);
        emit('update:modelValue', newState);
    }
};

// Collapsible state
import { ref } from 'vue';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';

const collapsedGroups = ref<Record<number, boolean>>({});

const toggleGroup = (idx: number) => {
    collapsedGroups.value[idx] = !collapsedGroups.value[idx];
};

</script>

<template>
    <div class="dynamic-section flex flex-col gap-6">
        <!-- Top-level Fields -->
        <div v-if="section.fields && section.fields.length > 0" class="gap-6" :class="{
            'flex flex-col': !section.gridCols,
            'grid grid-cols-1': !!section.gridCols,
            'md:grid-cols-2': section.gridCols === 2,
            'md:grid-cols-3': section.gridCols === 3
        }">
            <template v-for="field in section.fields" :key="field.key">
                <DynamicField :field="field" :modelValue="getDeep(modelValue, field.key)" :formModel="modelValue"
                    @update:modelValue="(val) => handleFieldUpdate(field.key, val)" :class="{
                        'col-span-1': true,
                        'md:col-span-2': field.colSpan === 2,
                        'md:col-span-3': field.colSpan === 3
                    }" />
            </template>
        </div>

        <!-- Groups -->
        <div v-if="section.groups && section.groups.length > 0">
            <div class="flex flex-col gap-6">
                <div v-for="(group, idx) in section.groups" :key="idx"
                    class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm overflow-hidden transition-all duration-200">
                    <div @click="toggleGroup(idx)"
                        class="p-4 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-200 dark:border-surface-700/50 flex items-center justify-between cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors select-none group"
                        :class="{ 'border-b-0': collapsedGroups[idx] }">
                        <div class="flex items-center gap-3 text-surface-900 dark:text-surface-100">
                            <component :is="group.icon"
                                class="w-5 h-5 text-surface-500 group-hover:text-primary-500 transition-colors"
                                :class="group.iconClass" v-if="group.icon" />
                            <span class="text-base font-semibold tracking-tight">{{ group.title }}</span>
                        </div>
                        <ChevronDown
                            class="w-5 h-5 text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300 transition-transform duration-200"
                            :class="{ '-rotate-90': collapsedGroups[idx] }" />
                    </div>

                    <div class="grid transition-all duration-300 ease-in-out"
                        :class="collapsedGroups[idx] ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'">
                        <div class="overflow-hidden">
                            <div class="p-5" :class="{
                                'flex flex-col gap-5': !group.gridCols,
                                'grid grid-cols-1 gap-5': !!group.gridCols && typeof group.gridCols === 'number',
                                'md:grid-cols-2': group.gridCols === 2,
                                'md:grid-cols-3': group.gridCols === 3,
                                'grid gap-5': typeof group.gridCols === 'string'
                            }"
                                :style="typeof group.gridCols === 'string' ? { gridTemplateColumns: group.gridCols } : {}">
                                <template v-for="field in group.fields" :key="field.key">
                                    <DynamicField :field="field" :modelValue="getDeep(modelValue, field.key)"
                                        :formModel="modelValue"
                                        @update:modelValue="(val) => handleFieldUpdate(field.key, val)" :class="{
                                            'col-span-1': true,
                                            'md:col-span-2': field.colSpan === 2,
                                            'md:col-span-3': field.colSpan === 3
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
