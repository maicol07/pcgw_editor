<script setup lang="ts">
import { ref } from 'vue';
import type { GeneralInfoRow } from '../models/GameData';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { X, Plus } from 'lucide-vue-next';

const model = defineModel<GeneralInfoRow[]>({ required: true });

const typeOptions = [
    { label: 'External Link', value: 'link' },
    { label: 'GOG.com links', value: 'gog' },
    { label: 'Steam Discussions', value: 'steam' },
    { label: 'PCGamingWiki Page', value: 'pcgw' },
];

function addRow() {
    model.value.push({
        type: 'link',
        label: '',
        url: '',
    });
}

function removeRow(index: number) {
    model.value.splice(index, 1);
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <div v-for="(row, index) in model" :key="index" 
             class="p-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl flex flex-col gap-4 relative group">
            
            <Button 
                severity="danger" 
                text 
                rounded 
                size="small" 
                class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-0 dark:bg-surface-950 shadow-md"
                @click="removeRow(index)"
            >
                <template #icon><X class="w-3 h-3" /></template>
            </Button>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-bold uppercase text-surface-500">Type</label>
                    <Select 
                        v-model="row.type" 
                        :options="typeOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        size="small"
                        class="w-full"
                    />
                </div>

                <template v-if="row.type === 'link'">
                    <div class="flex flex-col gap-1 lg:col-span-1">
                        <label class="text-[10px] font-bold uppercase text-surface-500">Label</label>
                        <InputText v-model="row.label" placeholder="e.g. Official forums" size="small" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 lg:col-span-2">
                        <label class="text-[10px] font-bold uppercase text-surface-500">URL</label>
                        <InputText v-model="row.url" placeholder="https://..." size="small" class="w-full" />
                    </div>
                </template>

                <template v-else-if="row.type === 'gog'">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-500">Product ID</label>
                        <InputText v-model="row.id" placeholder="1207665503" size="small" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-500">Forums ID</label>
                        <InputText v-model="row.forumsId" placeholder="terraria" size="small" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-bold uppercase text-surface-500">Note</label>
                        <InputText v-model="row.note" placeholder="Optional" size="small" class="w-full" />
                    </div>
                </template>

                <template v-else-if="row.type === 'steam'">
                    <div class="flex flex-col gap-1 lg:col-span-3">
                        <label class="text-[10px] font-bold uppercase text-surface-500">Steam App ID</label>
                        <InputText v-model="row.id" placeholder="105600" size="small" class="w-full" />
                    </div>
                </template>

                <template v-else-if="row.type === 'pcgw'">
                    <div class="flex flex-col gap-1 lg:col-span-3">
                        <label class="text-[10px] font-bold uppercase text-surface-500">Wiki Page</label>
                        <InputText v-model="row.label" placeholder="Discord" size="small" class="w-full" />
                    </div>
                </template>
            </div>
        </div>

        <Button 
            label="Add Link" 
            outlined 
            size="small" 
            class="w-full border-dashed"
            @click="addRow"
        >
            <template #icon><Plus class="w-4 h-4" /></template>
        </Button>
    </div>
</template>
