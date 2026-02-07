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
        <div v-if="section.fields && section.fields.length > 0" class="gap-4" :class="{
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
            <div class="flex flex-col gap-4">
                <div v-for="(group, idx) in section.groups" :key="idx"
                    class="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden transition-all duration-200">
                    <div @click="toggleGroup(idx)"
                        class="p-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 font-medium text-sm flex items-center justify-between cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors select-none"
                        :class="{ 'border-b-0': collapsedGroups[idx] }">
                        <div class="flex items-center gap-2 text-surface-700 dark:text-surface-200">
                            <component :is="group.icon" class="w-4 h-4" :class="group.iconClass" v-if="group.icon" />
                            {{ group.title }}
                        </div>
                        <component :is="collapsedGroups[idx] ? ChevronRight : ChevronDown"
                            class="w-4 h-4 text-surface-500 transition-transform duration-300"
                            :class="{ '-rotate-90': collapsedGroups[idx] }" />
                    </div>

                    <div class="grid transition-all duration-300 ease-in-out"
                        :class="collapsedGroups[idx] ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'">
                        <div class="overflow-hidden">
                            <div class="px-4 pb-4 pt-3" :class="{
                                'flex flex-col gap-4': !group.gridCols,
                                'grid grid-cols-1 gap-4': !!group.gridCols,
                                'md:grid-cols-2': group.gridCols === 2,
                                'md:grid-cols-3': group.gridCols === 3
                            }">
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
