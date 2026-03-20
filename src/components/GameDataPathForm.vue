<script setup lang="ts">
import { GameDataPathRow } from '../models/GameData';
import PathInputField from './ui/PathInputField.vue';
import { specialPaths, SpecialPath } from '../utils/specialPaths';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Popover from 'primevue/popover';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputText from 'primevue/inputtext';
import { Plus, Trash, X, Bookmark, Folder, Save, Gamepad2, Search } from 'lucide-vue-next';
import { ref, computed } from 'vue';

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
  icon?: string;
  description?: string;
}>();

const headerIcon = computed(() => {
  switch (props.icon) {
    case 'folder': return Folder;
    case 'save': return Save;
    default: return Gamepad2;
  }
});

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

const emit = defineEmits<{
  (e: 'update:rows', value: GameDataPathRow[]): void;
}>();

const addRow = () => {
  const newRows = [...props.rows, { platform: 'Windows', paths: [''] }];
  emit('update:rows', newRows);
};

const removeRow = (index: number) => {
  const newRows = [...props.rows];
  newRows.splice(index, 1);
  emit('update:rows', newRows);
};

const addPath = (rowIndex: number) => {
  const newRows = [...props.rows];
  if (!newRows[rowIndex].paths) newRows[rowIndex].paths = [];

  if (newRows[rowIndex].paths.length < 20) {
    newRows[rowIndex].paths.push('');
    emit('update:rows', newRows);
  }
};

const removePath = (rowIndex: number, pathIndex: number) => {
  const newRows = [...props.rows];
  if (newRows[rowIndex].paths) {
    newRows[rowIndex].paths.splice(pathIndex, 1);
    emit('update:rows', newRows);
  }
};

const searchQuery = ref('');

const pathsByCategory = computed(() => {
  const groups: Record<string, SpecialPath[]> = {};
  const query = searchQuery.value.toLowerCase().trim();

  specialPaths.forEach(p => {
    if (query) {
      if (!p.label.toLowerCase().includes(query) && 
          !p.value.toLowerCase().includes(query) && 
          !p.helpText.toLowerCase().includes(query)) {
        return;
      }
    }
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });
  return groups;
});

// insertQuickPath removed since logic is moved to selectQuickPath with cursor support

// Helper for display
const getPlatformIcon = (val: string) => {
  const opt = platformOptions.find(o => o.value === val);
  return opt ? opt.icon : iconGeneric;
};

// Popover logic
const op = ref();
const activeInput = ref<{ row: number, path: number, id: string } | null>(null);
const pathInputRefs = ref<Record<string, any>>({});

const setPathInputRef = (el: any, rowIndex: number, pathIndex: number) => {
    if (el) {
        pathInputRefs.value[`${rowIndex}-${pathIndex}`] = el;
    }
};

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
    const { row, path } = activeInput.value;
    const componentInstance = pathInputRefs.value[`${row}-${path}`];

    if (componentInstance && componentInstance.insertAtCaret) {
        componentInstance.insertAtCaret(value);
        // Force an update to parent
        setTimeout(() => emit('update:rows', [...props.rows]), 0);
    } else {
        let newValue = props.rows[row].paths[path] || '';
        newValue += value;
        const newRows = [...props.rows];
        newRows[row].paths[path] = newValue;
        emit('update:rows', newRows);
    }

    op.value.hide();
  }
};
</script>


<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-start justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
      <div class="flex gap-3">
        <div class="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 h-fit">
          <component :is="headerIcon" class="w-5 h-5" />
        </div>
        <div class="flex flex-col gap-0.5">
          <h3 class="text-base font-bold text-surface-900 dark:text-surface-0 tracking-tight">{{ title }}</h3>
          <p v-if="description" class="text-xs text-surface-500 dark:text-surface-400">{{ description }}</p>
        </div>
      </div>
      <Button label="Add Platform" size="small" text @click="addRow"
        class="px-3! py-1.5! bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs! font-medium rounded-md transition-colors">
        <template #icon>
          <Plus class="w-3.5 h-3.5" />
        </template>
      </Button>
    </div>

    <div class="flex flex-col">
      <div v-for="(row, rowIndex) in rows" :key="rowIndex"
        class="group relative flex flex-col gap-4 py-6 first:pt-0 border-b border-surface-200 dark:border-surface-700 last:border-0">

        <!-- Row Header / Platform Selector -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 max-w-md">
            <label
              class="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1.5">Platform</label>
            <Select v-model="row.platform" :options="platformOptions" optionLabel="label" optionValue="value"
              class="w-full">
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <img :src="getPlatformIcon(slotProps.value)" :alt="slotProps.value" class="w-5 h-5 shrink-0" />
                  <span class="truncate">{{ slotProps.value }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <img :src="slotProps.option.icon" :alt="slotProps.option.label" class="w-5 h-5 shrink-0" />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <Button icon="pi" text rounded severity="danger" v-tooltip.left="'Remove Platform'"
            class="mt-6 opacity-0 group-hover:opacity-100 transition-opacity" @click="removeRow(rowIndex)">
            <template #icon>
              <Trash class="w-4 h-4" />
            </template>
          </Button>
        </div>

        <!-- Paths -->
        <div class="flex flex-col gap-3 pl-4 border-l-2 border-surface-100 dark:border-surface-800 ml-1">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">File
              Paths</label>
            <Button v-if="row.paths.length < 20" label="Add Path" size="small" text @click="addPath(rowIndex)"
              class="px-2! py-1! h-auto text-xs">
              <template #icon>
                <Plus class="w-3 h-3" />
              </template>
            </Button>
          </div>

          <div class="grid grid-cols-1 gap-3">
            <div v-for="(_path, pathIndex) in row.paths" :key="pathIndex" class="flex gap-2 items-center group/path">
              <div class="flex-1">
                <InputGroup class="min-h-8">
                  <PathInputField 
                    :id="`path-input-${rowIndex}-${pathIndex}`" 
                    :ref="(el) => setPathInputRef(el, rowIndex, pathIndex)"
                    v-model="row.paths[pathIndex]"
                    placeholder="e.g. {{p|appdata}}\GameName\" class="w-full border-r-0! rounded-r-none" />
                  <InputGroupAddon class="p-0">
                    <Button icon="pi" severity="secondary" v-tooltip.top="'Insert Special Path'"
                      @click="(e) => toggleQuickPath(e, rowIndex, pathIndex)">
                      <template #icon>
                        <Bookmark class="w-4 h-4" />
                      </template>
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <Button v-if="row.paths.length > 1" text rounded severity="danger"
                class="w-8! h-8! p-0! opacity-0 group-hover/path:opacity-100 transition-opacity"
                @click="removePath(rowIndex, pathIndex)">
                <template #icon>
                  <X class="w-4 h-4" />
                </template>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Popover ref="op" @hide="searchQuery = ''">
      <div class="flex flex-col w-80">
        <div class="p-2 border-b border-surface-200 dark:border-surface-800">
          <InputGroup>
             <InputGroupAddon class="bg-transparent! border-r-0!">
               <Search class="w-4 h-4 text-surface-400" />
             </InputGroupAddon>
             <InputText v-model="searchQuery" placeholder="Search special paths..." class="w-full text-sm border-l-0!" autofocus />
          </InputGroup>
        </div>
        
        <div class="flex flex-col gap-4 p-2 max-h-80 overflow-y-auto">
          <div v-if="Object.keys(pathsByCategory).length === 0" class="text-center py-6 text-sm text-surface-500">
            No paths found matching "{{ searchQuery }}"
          </div>
          
          <div v-for="(paths, category) in pathsByCategory" :key="String(category)" class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1 sticky top-0 bg-surface-0 dark:bg-surface-900 z-10 py-1">{{ category }}</span>
            <div class="flex flex-col gap-1">
               <button v-for="item in paths" :key="item.id" 
                 class="flex flex-col items-start px-3 py-2 text-left hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors w-full"
                 @click="selectQuickPath(item.value)">
                 <span class="text-sm font-medium text-surface-700 dark:text-surface-200">{{ item.label }}</span>
                 <span class="text-xs text-surface-500 dark:text-surface-400 w-full line-clamp-2" :title="item.helpText">{{ item.helpText }}</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </Popover>
  </div>
</template>
