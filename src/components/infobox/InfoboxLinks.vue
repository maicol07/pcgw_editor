<script setup lang="ts">
import { inject, ref } from 'vue';
import { GameInfobox } from '../../models/GameData';
import InputText from 'primevue/inputtext';
import { Link, ShoppingBag, Terminal, Box } from 'lucide-vue-next';

defineProps<{
    modelValue: GameInfobox['links'];
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: GameInfobox['links']): void;
}>();

const updateLink = (key: keyof GameInfobox['links'], value: string) => {
    emit('update:modelValue', {
        ...props.modelValue,
        [key]: value
    });
};

const searchQuery = inject('searchQuery', ref(''));
const isMatch = (text: string) => searchQuery.value && text.toLowerCase().includes(searchQuery.value.toLowerCase());
const highlightClass = (text: string) => isMatch(text) ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 px-1 rounded' : '';

</script>

<template>
    <div class="flex flex-col gap-6">
        
        <!-- Stores -->
        <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3 ml-1 flex items-center gap-2">
                <ShoppingBag class="w-3 h-3 text-blue-500" /> Digital Stores
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Steam AppID')">Steam AppID</label>
                    <InputText :modelValue="modelValue.steam" @update:modelValue="v => updateLink('steam', v || '')" placeholder="e.g. 70" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('GOG Slug')">GOG Slug</label>
                    <InputText :modelValue="modelValue.gog" @update:modelValue="v => updateLink('gog', v || '')" placeholder="e.g. game_slug" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Epic Store')">Epic Store Slug</label>
                    <InputText :modelValue="modelValue.epic" @update:modelValue="v => updateLink('epic', v || '')" placeholder="e.g. product/game" class="w-full" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Microsoft Store')">Microsoft Store ID</label>
                    <InputText :modelValue="modelValue.microsoft" @update:modelValue="v => updateLink('microsoft', v || '')" placeholder="e.g. 9nblggh431sx" class="w-full" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Itch.io')">Itch.io</label>
                    <InputText :modelValue="modelValue.itch" @update:modelValue="v => updateLink('itch', v || '')" placeholder="e.g. user/game" class="w-full" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Zoom Platform')">Zoom Platform</label>
                    <InputText :modelValue="modelValue.zoom" @update:modelValue="v => updateLink('zoom', v || '')" placeholder="Slug" class="w-full" />
                </div>
            </div>
        </div>

        <!-- Wikis & DBs -->
         <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3 ml-1 flex items-center gap-2">
                <Link class="w-3 h-3 text-purple-500" /> Databases & Wikis
            </h4>
             <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Official Site')">Official Site</label>
                    <InputText :modelValue="modelValue.official" @update:modelValue="v => updateLink('official', v || '')" placeholder="URL" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('HLTB ID')">HLTB ID</label>
                    <InputText :modelValue="modelValue.hltb" @update:modelValue="v => updateLink('hltb', v || '')" placeholder="ID" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('IGDB ID')">IGDB ID</label>
                    <InputText :modelValue="modelValue.igdb" @update:modelValue="v => updateLink('igdb', v || '')" placeholder="slug" class="w-full" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Mobygames ID')">Mobygames ID</label>
                    <InputText :modelValue="modelValue.mobygames" @update:modelValue="v => updateLink('mobygames', v || '')" placeholder="/game/..." class="w-full" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('StrategyWiki')">StrategyWiki</label>
                    <InputText :modelValue="modelValue.strategyWiki" @update:modelValue="v => updateLink('strategyWiki', v || '')" placeholder="Page Title" class="w-full" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Wikipedia')">Wikipedia</label>
                    <InputText :modelValue="modelValue.wikipedia" @update:modelValue="v => updateLink('wikipedia', v || '')" placeholder="Page Title" class="w-full" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('VNDB ID')">VNDB ID</label>
                    <InputText :modelValue="modelValue.vndb" @update:modelValue="v => updateLink('vndb', v || '')" placeholder="e.g. v17" class="w-full" />
                </div>
             </div>
         </div>

         <!-- Compatibility -->
         <div>
             <h4 class="text-xs font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 mb-3 ml-1 flex items-center gap-2">
                <Terminal class="w-3 h-3 text-orange-500" /> Compatibility
            </h4>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300" :class="highlightClass('Lutris Slug')">Lutris Slug</label>
                    <InputText :modelValue="modelValue.lutris" @update:modelValue="v => updateLink('lutris', v || '')" placeholder="e.g. half-life-2" class="w-full" />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-surface-600 dark:text-surface-300 flex items-center gap-2" :class="highlightClass('WineHQ Slug')">
                        WineHQ Slug
                    </label>
                    <InputText :modelValue="modelValue.wineHq" @update:modelValue="v => updateLink('wineHq', v || '')" placeholder="e.g. half-life" class="w-full" />
                    <div class="flex flex-col gap-0.5 ml-1 border-l-2 border-surface-200 dark:border-surface-700 pl-2">
                        <label class="text-[10px] font-bold text-surface-400 uppercase">Side Parameter</label>
                        <InputText :modelValue="(modelValue.wineHqSide as string)" @update:modelValue="v => updateLink('wineHqSide', v || '')" placeholder="e.g. Windows" class="w-full h-7 text-sm" />
                    </div>
                </div>
             </div>
         </div>
    </div>
</template>
