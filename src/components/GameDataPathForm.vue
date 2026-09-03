<script setup lang="ts">
import { GameDataPathRow } from '../models/GameData';
import PathInputField from './ui/PathInputField.vue';
import { specialPaths, SpecialPath, commonPathTokens, suggestTokenForRawEnvVar } from '../utils/specialPaths';
import Button from 'openvue/button';
import Select from 'openvue/select';
import Popover from 'openvue/popover';
import InputGroup from 'openvue/inputgroup';
import InputGroupAddon from 'openvue/inputgroupaddon';
import InputText from 'openvue/inputtext';
import Menu from 'openvue/menu';
import SubsectionCodeWrapper from './common/SubsectionCodeWrapper.vue';
import { Plus, Trash, Bookmark, Folder, Save, Gamepad2, Search, ShoppingCart, GripVertical, Copy, MoreVertical, Code2, FileText } from '@lucide/vue';
import { VueDraggable } from 'vue-draggable-plus';
import { ref, computed } from 'vue';

// Icons
import iconWindows from '../assets/icons/os-windows.svg';
import iconMac from '../assets/icons/os-osx.svg';
import iconLinux from '../assets/icons/os-linux.svg';
import iconSteam from '../assets/icons/store-steam.svg';
import iconGog from '../assets/icons/store-gogcom.svg';
import iconEpic from '../assets/icons/store-epicgames.svg';
import iconUbisoft from '../assets/icons/store-ubisoft.svg';
import iconOrigin from '../assets/icons/store-ea.svg'; // EA App uses Origin icon or new?
import iconMs from '../assets/icons/store-microsoft.svg';
import iconBooter from '../assets/icons/os-booter.svg';
import iconDos from '../assets/icons/os-dos.svg';
import iconGeneric from '../assets/icons/menu-icon.svg'; // Default

const props = defineProps<{
  rows: GameDataPathRow[];
  title: string;
  icon?: string;
  description?: string;
  sectionKey?: string;
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
  { label: 'EA app', value: 'EA app', icon: iconOrigin }, // Using EA App icon
  { label: 'Microsoft Store', value: 'Microsoft Store', icon: iconMs },
  { label: 'Amazon Games', value: 'Amazon Games', icon: ShoppingCart },
  { label: 'PC booter', value: 'PC booter', icon: iconBooter },
  { label: 'DOS', value: 'DOS', icon: iconDos },
];

const emit = defineEmits<{
  (e: 'update:rows', value: GameDataPathRow[]): void;
}>();

// Writable view for VueDraggable reordering (rows is a prop → emit on change).
const localRows = computed<GameDataPathRow[]>({
  get: () => props.rows,
  set: (v) => emit('update:rows', v),
});

let rowIdCounter = 0;
let pathIdCounter = 0;

function ensureRowId(row: GameDataPathRow): number {
  const r = row as any;
  if (!r._id) {
    Object.defineProperty(r, '_id', {
      value: ++rowIdCounter,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
  return r._id;
}

function ensurePathIds(row: GameDataPathRow): number[] {
  const r = row as any;
  if (!r._pathIds || r._pathIds.length !== (r.paths?.length ?? 0)) {
    const existing: number[] = r._pathIds || [];
    const ids = (r.paths || []).map((_: string, i: number) => existing[i] ?? ++pathIdCounter);
    if (r._pathIds) {
      r._pathIds = ids;
    } else {
      Object.defineProperty(r, '_pathIds', {
        value: ids,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
  }
  return r._pathIds;
}

function getPathId(row: GameDataPathRow, pathIndex: number): number {
  const ids = ensurePathIds(row);
  return ids[pathIndex] ?? pathIndex;
}

const addRow = () => {
  const newRow: GameDataPathRow = { platform: 'Windows', paths: [''] };
  ensureRowId(newRow);
  ensurePathIds(newRow);
  const newRows = [...props.rows, newRow];
  emit('update:rows', newRows);
};

// Quick-add a Windows row prefilled with a common token (used in empty state)
const quickAddRow = (value: string) => {
  const newRow: GameDataPathRow = { platform: 'Windows', paths: [value] };
  ensureRowId(newRow);
  ensurePathIds(newRow);
  const newRows = [...props.rows, newRow];
  emit('update:rows', newRows);
};

const removeRow = (index: number) => {
  const newRows = [...props.rows];
  newRows.splice(index, 1);
  emit('update:rows', newRows);
};

const duplicateRow = (index: number) => {
  const source = props.rows[index];
  if (!source) return;
  const clone: GameDataPathRow = {
    platform: source.platform,
    paths: [...(source.paths || [])]
  };
  ensureRowId(clone);
  ensurePathIds(clone);
  const newRows = [...props.rows];
  newRows.splice(index + 1, 0, clone);
  emit('update:rows', newRows);
};

const addPath = (rowIndex: number) => {
  const newRows = [...props.rows];
  const row = newRows[rowIndex];
  if (!row) return;
  const paths = row.paths ? [...row.paths] : [];

  if (paths.length < 20) {
    const currentIds = ensurePathIds(row);
    const newIds = [...currentIds, ++pathIdCounter];
    paths.push('');
    const newRow = { ...row, paths };
    Object.defineProperty(newRow, '_id', {
      value: ensureRowId(row),
      writable: true,
      enumerable: false,
      configurable: true,
    });
    Object.defineProperty(newRow, '_pathIds', {
      value: newIds,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    newRows[rowIndex] = newRow;
    emit('update:rows', newRows);
  }
};

const duplicatePath = (rowIndex: number, pathIndex: number) => {
  const newRows = [...props.rows];
  const row = newRows[rowIndex];
  if (!row || !row.paths || row.paths.length >= 20) return;
  const currentIds = ensurePathIds(row);
  const newIds = [...currentIds];
  newIds.splice(pathIndex + 1, 0, ++pathIdCounter);
  const newPaths = [...row.paths];
  newPaths.splice(pathIndex + 1, 0, newPaths[pathIndex]);
  const newRow = { ...row, paths: newPaths };
  Object.defineProperty(newRow, '_id', {
    value: ensureRowId(row),
    writable: true,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(newRow, '_pathIds', {
    value: newIds,
    writable: true,
    enumerable: false,
    configurable: true,
  });
  newRows[rowIndex] = newRow;
  emit('update:rows', newRows);
};

const removePath = (rowIndex: number, pathIndex: number) => {
  const newRows = [...props.rows];
  const row = newRows[rowIndex];
  if (!row?.paths) return;
  const currentIds = ensurePathIds(row);
  const newIds = [...currentIds];
  newIds.splice(pathIndex, 1);
  const newPaths = [...row.paths];
  newPaths.splice(pathIndex, 1);
  const newRow = { ...row, paths: newPaths };
  Object.defineProperty(newRow, '_id', {
    value: ensureRowId(row),
    writable: true,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(newRow, '_pathIds', {
    value: newIds,
    writable: true,
    enumerable: false,
    configurable: true,
  });
  newRows[rowIndex] = newRow;
  emit('update:rows', newRows);
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

const getSuggestion = (val: string) => suggestTokenForRawEnvVar(val);

const applyTokenSuggestion = (rowIndex: number, pathIndex: number) => {
  const currentVal = props.rows[rowIndex]?.paths?.[pathIndex] || '';
  const s = suggestTokenForRawEnvVar(currentVal);
  if (!s) return;
  const idx = currentVal.toUpperCase().indexOf(s.raw);
  if (idx < 0) return;
  const newStr = currentVal.slice(0, idx) + s.token + currentVal.slice(idx + s.raw.length);
  const newRows = [...props.rows];
  newRows[rowIndex].paths[pathIndex] = newStr;
  emit('update:rows', newRows);
};

// Platform & Path Action Menus
const platformMenu = ref();
const activePlatformIndex = ref<number | null>(null);

const togglePlatformMenu = (event: Event, index: number) => {
  activePlatformIndex.value = index;
  platformMenu.value.toggle(event);
};

const platformMenuItems = computed<any[]>(() => {
  if (activePlatformIndex.value === null) return [];
  const index = activePlatformIndex.value;
  return [
    {
      label: 'Duplicate Platform',
      icon: Copy,
      command: () => duplicateRow(index),
    },
    {
      label: 'Remove Platform',
      icon: Trash,
      class: 'text-red-500 dark:text-red-400',
      command: () => removeRow(index),
    },
  ];
});

const pathMenu = ref();
const activePathTarget = ref<{ rowIndex: number; pathIndex: number } | null>(null);

const togglePathMenu = (event: Event, rowIndex: number, pathIndex: number) => {
  activePathTarget.value = { rowIndex, pathIndex };
  pathMenu.value.toggle(event);
};

const pathMenuItems = computed<any[]>(() => {
  if (!activePathTarget.value) return [];
  const { rowIndex, pathIndex } = activePathTarget.value;
  const row = props.rows[rowIndex];
  if (!row?.paths) return [];

  const items = [];
  if (row.paths.length < 20) {
    items.push({
      label: 'Duplicate Path',
      icon: Copy,
      command: () => duplicatePath(rowIndex, pathIndex),
    });
  }
  if (row.paths.length > 1) {
    items.push({
      label: 'Remove Path',
      icon: Trash,
      class: 'text-red-500 dark:text-red-400',
      command: () => removePath(rowIndex, pathIndex),
    });
  }
  return items;
});
</script>


<template>
  <SubsectionCodeWrapper :sectionKey="sectionKey">
    <template #header="{ isCodeMode, toggleCode }">
      <div class="flex items-start justify-between pb-4 border-b border-surface-200 dark:border-surface-800">
        <div class="flex gap-3">
          <div class="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 h-fit">
            <component :is="headerIcon" class="w-5 h-5" />
          </div>
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-surface-900 dark:text-surface-0 tracking-tight">{{ title }}</h3>
              <Transition name="scale-fade">
                <span v-if="sectionKey && isCodeMode"
                  class="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  Code
                </span>
              </Transition>
            </div>
            <p v-if="description" class="text-xs text-surface-500 dark:text-surface-400">{{ description }}</p>
          </div>
        </div>
        <div v-if="sectionKey" class="flex items-center gap-1">
          <button
            type="button"
            @click.stop="toggleCode"
            v-tooltip.top="isCodeMode ? 'Switch to visual editor' : 'Switch to code editor'"
            :aria-label="isCodeMode ? 'Switch to visual editor' : 'Switch to code editor'"
            class="p-1.5 rounded-lg transition-colors active:scale-95"
            :class="isCodeMode
              ? 'text-primary-600 dark:text-primary-400 bg-primary-500/10 hover:bg-primary-500/20'
              : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-200/60 dark:hover:bg-surface-800/60'">
            <Transition name="scale-fade" mode="out-in">
              <component :is="isCodeMode ? FileText : Code2" :key="isCodeMode ? 'visual-icon' : 'code-icon'" class="w-4 h-4 transition-transform duration-200" />
            </Transition>
          </button>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-6 pt-1">

    <!-- Empty state: quick-add common locations -->
    <div v-if="!rows.length" class="flex flex-col items-center gap-3 py-8 text-center">
      <p class="text-sm text-surface-500 dark:text-surface-400">No locations yet. Add a common one to get started:</p>
      <div class="flex flex-wrap justify-center gap-2 max-w-lg">
        <Button v-for="t in commonPathTokens" :key="t.id" :label="t.label" size="small" severity="secondary" outlined
          @click="quickAddRow(t.value)">
          <template #icon>
            <Plus class="w-3.5 h-3.5" />
          </template>
        </Button>
      </div>
    </div>

    <VueDraggable v-model="localRows" target=".sortable-platform-list" :animation="150" handle=".drag-handle">
      <TransitionGroup name="platform-list" tag="div" class="sortable-platform-list flex flex-col gap-4">
        <div v-for="(row, rowIndex) in rows" :key="ensureRowId(row)"
          class="@container surface-card overflow-hidden flex flex-col group">


        <!-- Header: drag · platform · delete -->
        <div class="flex items-center gap-2 px-2.5 py-2 bg-surface-50 dark:bg-surface-800/60 border-b border-surface-200 dark:border-surface-700">
          <button type="button"
            class="drag-handle cursor-grab active:cursor-grabbing text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 shrink-0 p-1 -ml-1 rounded transition-colors"
            aria-label="Drag to reorder">
            <GripVertical class="w-4 h-4" />
          </button>

          <Select v-model="row.platform" :options="platformOptions" optionLabel="label" optionValue="value"
            aria-label="Platform" class="flex-1 min-w-0">
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center gap-2">
                <img v-if="typeof getPlatformIcon(slotProps.value) === 'string'" :src="getPlatformIcon(slotProps.value) as string" :alt="slotProps.value" class="w-5 h-5 shrink-0 object-contain" />
                <component v-else :is="getPlatformIcon(slotProps.value)" class="w-4 h-4 text-surface-500" />
                <span class="truncate font-medium">{{ slotProps.value }}</span>
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <img v-if="typeof slotProps.option.icon === 'string'" :src="slotProps.option.icon" :alt="slotProps.option.label" class="w-5 h-5 shrink-0 object-contain" />
                <component v-else :is="slotProps.option.icon" class="w-4 h-4 text-surface-500" />
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Select>

          <Button type="button" text severity="secondary" size="small"
            aria-label="Platform actions" v-tooltip.top="'More actions'"
            class="shrink-0 !p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-md"
            @click="(e) => togglePlatformMenu(e, rowIndex)">
            <template #icon>
              <MoreVertical class="w-4 h-4 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200" />
            </template>
          </Button>
        </div>

        <!-- Body: file paths -->
        <div class="p-3 flex flex-col gap-3">
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

          <TransitionGroup name="path-list" tag="div" class="grid grid-cols-1 gap-2">
            <div v-for="(_path, pathIndex) in row.paths" :key="getPathId(row, pathIndex)" class="flex gap-2 items-start group/path">
              <div class="flex-1 min-w-0">
                <InputGroup class="min-h-8">
                  <PathInputField
                    :id="`path-input-${rowIndex}-${pathIndex}`"
                    :ref="(el) => setPathInputRef(el, rowIndex, pathIndex)"
                    v-model="row.paths[pathIndex]"
                    placeholder="e.g. {{p|appdata}}\GameName\" class="w-full border-r-0! rounded-r-none" />
                  <InputGroupAddon class="p-0">
                    <Button aria-label="Insert Special Path" icon="pi" severity="secondary" v-tooltip.top="'Insert Special Path'"
                      @click="(e) => toggleQuickPath(e, rowIndex, pathIndex)">
                      <template #icon>
                        <Bookmark class="w-4 h-4" />
                      </template>
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <div v-if="getSuggestion(row.paths[pathIndex])" class="flex items-center gap-1.5 mt-1 text-xs text-amber-600 dark:text-amber-400 flex-wrap">
                  <span>Use the wiki token</span>
                  <button type="button" @click="applyTokenSuggestion(rowIndex, pathIndex)"
                    class="font-mono font-medium underline decoration-dotted hover:text-amber-700 dark:hover:text-amber-300">
                    {{ getSuggestion(row.paths[pathIndex])?.token }}
                  </button>
                  <span>instead of <span class="font-mono">{{ getSuggestion(row.paths[pathIndex])?.raw }}</span></span>
                </div>
              </div>

              <Button type="button" text rounded severity="secondary"
                class="w-8! h-8! p-0! opacity-0 group-hover/path:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0"
                aria-label="Path actions" v-tooltip.top="'More actions'"
                @click="(e) => togglePathMenu(e, rowIndex, pathIndex)">
                <template #icon>
                  <MoreVertical class="w-4 h-4" />
                </template>
              </Button>
            </div>
          </TransitionGroup>
        </div>
      </div>
      </TransitionGroup>
    </VueDraggable>

    <Button label="Add Platform" severity="secondary" outlined class="w-full border-dashed" @click="addRow">
      <template #icon>
        <Plus class="w-4 h-4" />
      </template>
    </Button>

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

    <Menu ref="platformMenu" :model="platformMenuItems" :popup="true">
      <template #item="{ item, props }">
        <a v-bind="props.action" class="flex items-center w-full px-3 py-2 cursor-pointer" :class="item.class">
          <component :is="item.icon" v-if="item.icon" class="w-4 h-4 mr-2 shrink-0" />
          <span>{{ item.label }}</span>
        </a>
      </template>
    </Menu>

    <Menu ref="pathMenu" :model="pathMenuItems" :popup="true">
      <template #item="{ item, props }">
        <a v-bind="props.action" class="flex items-center w-full px-3 py-2 cursor-pointer" :class="item.class">
          <component :is="item.icon" v-if="item.icon" class="w-4 h-4 mr-2 shrink-0" />
          <span>{{ item.label }}</span>
        </a>
      </template>
    </Menu>
    </div>
  </SubsectionCodeWrapper>
</template>

<style scoped>
/* Platform card transitions */
.platform-list-enter-active,
.platform-list-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.platform-list-enter-from,
.platform-list-leave-to {
  opacity: 0;
  max-height: 0;
  transform: scale(0.98) translateY(-8px);
}

.platform-list-enter-to,
.platform-list-leave-from {
  opacity: 1;
  max-height: 600px;
  transform: scale(1) translateY(0);
}

.platform-list-move {
  transition: transform 0.25s ease;
}

/* Path item transitions */
.path-list-enter-active,
.path-list-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.path-list-enter-from,
.path-list-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px) scale(0.98);
}

.path-list-enter-to,
.path-list-leave-from {
  opacity: 1;
  max-height: 120px;
  transform: translateY(0) scale(1);
}

.path-list-move {
  transition: transform 0.25s ease;
}

@media (prefers-reduced-motion: reduce) {
  .platform-list-enter-active,
  .platform-list-leave-active,
  .platform-list-move,
  .path-list-enter-active,
  .path-list-leave-active,
  .path-list-move {
    transition: none;
  }
}
</style>
