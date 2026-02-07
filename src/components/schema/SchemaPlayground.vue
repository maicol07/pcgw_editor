<script setup lang="ts">
import { ref } from 'vue';
import { fieldsConfig } from '../../config/fields';
import { SchemaService } from '../../services/SchemaService';
import DynamicSection from './DynamicSection.vue';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';

const wikitext = ref<string>(`{{Infobox game
|cover = MyGameCover.jpg
|developers = 
{{Infobox game/row/developer|My Developer}}
{{Infobox game/row/publisher|My Publisher}}
|license = commercial
}}

{{GameData|config={"test":1}|config_data=SomeComplexData}}`);

const state = ref<Record<string, any>>({});
const outputWikitext = ref('');

const parse = () => {
    state.value = SchemaService.parseState(wikitext.value, fieldsConfig);
};

const generate = () => {
    outputWikitext.value = SchemaService.generateWikitext(wikitext.value, state.value, fieldsConfig);
};
</script>

<template>
    <div class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-4/5 overflow-hidden border-t">
        <div class="flex flex-col gap-2 h-full">
            <h2 class="text-xl font-bold">1. Input Wikitext</h2>
            <p class="text-sm text-surface-500">Edit the source wikitext below</p>
            <Textarea v-model="wikitext" class="w-full h-64 font-mono text-sm" />
            <div class="flex gap-2">
                <Button label="Parse to Form >>" @click="parse" />
            </div>
        </div>

        <div class="flex flex-col gap-2 h-full overflow-y-auto border-l pl-4">
            <h2 class="text-xl font-bold">2. Dynamic Form</h2>
            <p class="text-sm text-surface-500">Generated from config/fields.ts</p>
            
            <div v-if="Object.keys(state).length === 0" class="text-surface-500 italic p-4 border border-dashed rounded">
                Click "Parse to Form" to generate the form based on schema.
            </div>
            
            <template v-else>
                <div class="flex flex-col gap-4">
                     <DynamicSection 
                        v-for="section in fieldsConfig"
                        :key="section.id"
                        :section="section"
                        :modelValue="state[section.id] || {}"
                        @update:modelValue="(val) => state[section.id] = val"
                     />
                 </div>
                 
                 <div class="mt-4 pt-4 border-t">
                     <Button label="Generate Wikitext" icon="pi pi-refresh" severity="secondary" @click="generate" />
                 </div>
                 
                 <div v-if="outputWikitext" class="mt-4">
                    <h3 class="font-bold mb-2">3. Output Result:</h3>
                    <div class="bg-surface-100 dark:bg-surface-800 p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-64 border border-surface-300 dark:border-surface-600">
{{ outputWikitext }}
                    </div>
                 </div>
            </template>
        </div>
    </div>
</template>
