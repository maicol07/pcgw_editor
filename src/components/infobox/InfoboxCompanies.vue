<script setup lang="ts">
import { inject, ref } from 'vue';
import GenericListForm from '../common/GenericListForm.vue';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import { GameInfobox } from '../../models/GameData';

const props = defineProps<{
    developers: GameInfobox['developers'];
    publishers: GameInfobox['publishers'];
    engines: GameInfobox['engines'];
}>();

const emit = defineEmits<{
    (e: 'update:developers', value: GameInfobox['developers']): void;
    (e: 'update:publishers', value: GameInfobox['publishers']): void;
    (e: 'update:engines', value: GameInfobox['engines']): void;
}>();

// Search Highlight Logic
const searchQuery = inject('searchQuery', ref(''));
const isMatch = (text: string) => searchQuery.value && text.toLowerCase().includes(searchQuery.value.toLowerCase());

</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Developers -->
        <GenericListForm 
            :modelValue="developers" 
            @update:modelValue="emit('update:developers', $event)"
            label="Developers" 
            tooltip="Search and select multiple developers" 
            dataSource="companies"
            :highlight="isMatch('Developers')"
        >
            <!-- Custom Extra Fields for Developer (Porter) -->
            <template #extra="{ item, update, index }">
                 <div class="flex items-center gap-2 mt-1 px-1">
                     <span class="text-[10px] uppercase font-bold text-surface-500">{{ item.type === 'porter' ? 'OS' : 'Subtitle' }}</span>
                     <InputText 
                        :modelValue="item.extra || ''" 
                        @update:modelValue="v => update(index, 'extra', v)" 
                        :placeholder="item.type === 'porter' ? 'e.g. Linux' : 'e.g. Main game'" 
                        class="text-xs p-1 flex-1 h-6" 
                    />
                 </div>
            </template>
             <template #actions="{ item, update, index }">
                 <div class="flex items-center gap-1 mx-1">
                     <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                     <label class="text-[10px] uppercase font-bold text-surface-400 cursor-pointer select-none" :for="'porter-'+index">Porter</label>
                     <Checkbox 
                        :inputId="'porter-'+index"
                        :modelValue="item.type === 'porter'" 
                        @update:modelValue="v => update(index, 'type', v ? 'porter' : 'developer')" 
                        :binary="true" 
                        class="scale-75 origin-center"
                    />
                 </div>
             </template>
        </GenericListForm>

        <!-- Publishers -->
         <GenericListForm 
            :modelValue="publishers" 
            @update:modelValue="emit('update:publishers', $event)"
            label="Publishers" 
            tooltip="Search and select multiple publishers" 
            dataSource="companies"
            :highlight="isMatch('Publishers')"
        >
             <template #extra="{ item, update, index }">
                 <div class="flex items-center gap-2 mt-1 px-1">
                     <span class="text-[10px] uppercase font-bold text-surface-500">Subtitle</span>
                     <InputText 
                        :modelValue="item.extra || ''" 
                        @update:modelValue="v => update(index, 'extra', v)" 
                        placeholder="Subtitle" 
                        class="text-xs p-1 flex-1 h-6" 
                    />
                 </div>
             </template>
        </GenericListForm>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <!-- Engines -->
         <GenericListForm 
            :modelValue="engines" 
            @update:modelValue="emit('update:engines', $event)"
            label="Engines" 
            tooltip="Search and select game engine(s)" 
            dataSource="engines"
            :highlight="isMatch('Engines')"
        >
             <template #extra="{ item, update, index }">
                 <div class="grid grid-cols-2 gap-2 mt-1">
                     <div class="flex flex-col gap-0.5">
                        <span class="text-[10px] uppercase font-bold text-surface-500">Display Name</span>
                        <InputText 
                            :modelValue="item.displayName || ''" 
                            @update:modelValue="v => update(index, 'displayName', v)" 
                            placeholder="e.g. Unity 2017" 
                            class="text-xs p-1 h-6" 
                        />
                     </div>
                     <div class="flex flex-col gap-0.5">
                        <span class="text-[10px] uppercase font-bold text-surface-500">Build/Version</span>
                         <InputText 
                            :modelValue="item.build || ''" 
                            @update:modelValue="v => update(index, 'build', v)" 
                            placeholder="e.g. 2017.4.19f1" 
                            class="text-xs p-1 h-6" 
                        />
                     </div>
                 </div>
                 <div class="flex flex-col gap-0.5 mt-1">
                     <span class="text-[10px] uppercase font-bold text-surface-500">Used For</span>
                     <InputText 
                        :modelValue="item.extra || ''" 
                        @update:modelValue="v => update(index, 'extra', v)" 
                        placeholder="e.g. Original release" 
                        class="text-xs p-1 h-6" 
                    />
                 </div>
             </template>
        </GenericListForm>
    </div>
</template>
