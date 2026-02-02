<script setup lang="ts">
import { GameDataPathRow } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Popover from 'primevue/popover';
import { Plus, Trash, X, Bookmark } from 'lucide-vue-next';
import { ref } from 'vue';

// Icons
import iconWindows from '../assets/icons/os-windows.svg';
import iconMac from '../assets/icons/os-osx.svg';
import iconLinux from '../assets/icons/os-linux.svg';
import iconSteam from '../assets/icons/store-steam.svg';
import iconGog from '../assets/icons/store-gogcom.svg';
import iconEpic from '../assets/icons/store-epicgames.svg';
import iconUbisoft from '../assets/icons/store-uplay.svg';
import iconOrigin from '../assets/icons/store-origin.svg'; // EA App uses Origin icon or new?
import iconMs from '../assets/icons/store-microsoft.svg';
import iconAmazon from '../assets/icons/store-ws.svg'; // Placeholder or find Amazon
import iconGeneric from '../assets/icons/menu-icon.svg'; // Default

const props = defineProps<{
  rows: GameDataPathRow[];
  title: string;
}>();

const platformOptions = [
  { label: 'Windows', value: 'Windows', icon: iconWindows },
  { label: 'Mac OS', value: 'Mac OS', icon: iconMac },
  { label: 'OS X', value: 'OS X', icon: iconMac },
  { label: 'Mac App Store', value: 'Mac App Store', icon: iconMac },
  { label: 'Linux', value: 'Linux', icon: iconLinux },
  { label: 'Steam', value: 'Steam', icon: iconSteam },
  { label: 'GOG.com', value: 'GOG.com', icon: iconGog },
  { label: 'Epic Games Launcher', value: 'Epic Games Launcher', icon: iconEpic },
  { label: 'Ubisoft Connect', value: 'Ubisoft Connect', icon: iconUbisoft },
  { label: 'EA app', value: 'EA app', icon: iconOrigin }, // Using Origin icon for now or generic
  { label: 'Microsoft Store', value: 'Microsoft Store', icon: iconMs },
  { label: 'Amazon Games', value: 'Amazon Games', icon: iconAmazon },
  { label: 'PC booter', value: 'PC booter', icon: iconGeneric },
  { label: 'DOS', value: 'DOS', icon: iconGeneric },
];

const addRow = () => {
  props.rows.push({ platform: 'Windows', paths: [''] });
};

const removeRow = (index: number) => {
  props.rows.splice(index, 1);
};

const addPath = (rowIndex: number) => {
  if (props.rows[rowIndex].paths.length < 20) {
    props.rows[rowIndex].paths.push('');
  }
};

const removePath = (rowIndex: number, pathIndex: number) => {
  props.rows[rowIndex].paths.splice(pathIndex, 1);
};

const quickPaths = [
  { label: 'Steam', value: '{{p|steam}}' },
  { label: 'Ubisoft', value: '{{p|uplay}}' },
  { label: 'Origin', value: '{{p|origin}}' },
  { label: 'GOG', value: '{{p|gog}}' },
  { label: 'Battle.net', value: '{{p|battlenet}}' },
  { label: 'Epic', value: '{{p|epic}}' },
  { label: 'MS Store', value: '{{p|msstore}}' },
  { label: 'AppData', value: '{{p|appdata}}' },
  { label: 'Local AppData', value: '{{p|localappdata}}' },
  { label: 'ProgramData', value: '{{p|programdata}}' },
  { label: 'User Profile', value: '{{p|userprofile}}' },
  { label: 'Game Dir', value: '{{p|game}}' },
  { label: 'System', value: '{{p|system}}' },
  { label: 'User Home (Linux)', value: '{{p|user}}' }
];

// insertQuickPath removed since logic is moved to selectQuickPath with cursor support

// Helper for display
const getPlatformIcon = (val: string) => {
    const opt = platformOptions.find(o => o.value === val);
    return opt ? opt.icon : iconGeneric;
};

// Popover logic
const op = ref();
const activeInput = ref<{row: number, path: number, id: string} | null>(null);

const toggleQuickPath = (event: Event, rowIndex: number, pathIndex: number) => {
    activeInput.value = { 
        row: rowIndex, 
        path: pathIndex,
        id: `path-input-${rowIndex}-${pathIndex}`
    };
    op.value.toggle(event);
};

const selectQuickPath = (value: string) => {
    if (activeInput.value) {
        const { row, path, id } = activeInput.value;
        const inputEl = document.getElementById(id) as HTMLInputElement;
        
        let newValue = props.rows[row].paths[path] || '';
        if (inputEl) {
            const start = inputEl.selectionStart || 0;
            const end = inputEl.selectionEnd || 0;
            newValue = newValue.substring(0, start) + value + newValue.substring(end);
            
            // Wait for re-render then restore focus? 
            // Actually just setting it is enough for now, user can continue typing.
        } else {
            // Fallback
            newValue += value;
        }

        props.rows[row].paths[path] = newValue;
        op.value.hide();
    }
};
</script>


<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-2">
      <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">{{ title }}</h3>
      <Button label="Add Platform Row" size="small" text @click="addRow">
        <template #icon><Plus class="w-4 h-4" /></template>
      </Button>
    </div>

    <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="p-4 rounded-lg bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-800 flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1">
          <label class="text-sm font-medium text-surface-600 dark:text-surface-300">Platform</label>
          <Select v-model="row.platform" :options="platformOptions" optionLabel="label" optionValue="value" class="w-full md:w-64">
            <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                    <img :src="getPlatformIcon(slotProps.value)" :alt="slotProps.value" class="w-5 h-5" />
                    <span>{{ slotProps.value }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
                <div class="flex items-center gap-2">
                    <img :src="slotProps.option.icon" :alt="slotProps.option.label" class="w-5 h-5" />
                    <span>{{ slotProps.option.label }}</span>
                </div>
            </template>
          </Select>
        </div>
        <Button severity="danger" text rounded @click="removeRow(rowIndex)">
            <template #icon><Trash class="w-4 h-4" /></template>
        </Button>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">File Paths</label>
          <Button v-if="row.paths.length < 20" label="Add Path" size="small" text @click="addPath(rowIndex)">
            <template #icon><Plus class="w-4 h-4" /></template>
          </Button>
        </div>
        
        <div class="grid grid-cols-1 gap-2">
          <div v-for="(_path, pathIndex) in row.paths" :key="pathIndex" class="flex gap-2">
            <InputText 
                :id="`path-input-${rowIndex}-${pathIndex}`"
                v-model="row.paths[pathIndex]" 
                placeholder="e.g. {{p|appdata}}\GameName\" 
                class="flex-1" 
            />
            <Button 
                icon="pi" 
                severity="secondary" 
                variant="outlined" 
                v-tooltip.top="'Insert Special Path'"
                @click="(e) => toggleQuickPath(e, rowIndex, pathIndex)"
            >
                <template #icon>
                    <Bookmark class="w-4 h-4" />
                </template>
            </Button>
            <Button v-if="row.paths.length > 1" severity="danger" text rounded @click="removePath(rowIndex, pathIndex)">
                <template #icon><X class="w-5 h-5" /></template>
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    <Popover ref="op">
        <div class="flex flex-col gap-2 p-1 max-w-sm">
            <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1">Insert Special Path</span>
            <div class="flex flex-wrap gap-2">
                <Button 
                    v-for="item in quickPaths" 
                    :key="item.label" 
                    :label="item.label" 
                    severity="secondary" 
                    variant="outlined" 
                    size="small" 
                    class="text-xs! py-1! px-2!"
                    @click="selectQuickPath(item.value)"
                />
            </div>
        </div>
    </Popover>
  </div>
</template>
