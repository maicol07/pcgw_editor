<script setup lang="ts">
import { ref } from 'vue';
import { Issue } from '../../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';
import { X, Plus, Info, GripVertical, ChevronDown } from 'lucide-vue-next';
import WysiwygEditor from '../common/WysiwygEditor.vue';
import { VueDraggable } from 'vue-draggable-plus';

const dragList = defineModel<Issue[]>({ default: () => [] });

const idMap = new WeakMap<Issue, number>();
let nextId = 0;
function getRowId(row: Issue) {
  if (!idMap.has(row)) idMap.set(row, nextId++);
  return idMap.get(row)!;
}

// Status maps to the `fixed` boolean (source of truth for wikitext serialization).
// "Open" => fixed=false, anything else => fixed=true.
const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Workaround available', value: 'workaround' },
  { label: 'Fixed in patch', value: 'patch' },
  { label: 'Abandoned', value: 'abandoned' },
];

function getStatus(row: Issue): string {
  return row.fixed ? 'patch' : 'open';
}

function setStatus(row: Issue, value: string) {
  row.fixed = value !== 'open';
}

function addRow() {
  dragList.value = [...dragList.value, { title: '', fixed: false, body: '' }];
}

function removeRow(index: number) {
  dragList.value = dragList.value.filter((_, i) => i !== index);
}

const guidelinesOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-4">
    <VueDraggable v-model="dragList" :animation="150" handle=".drag-handle" class="flex flex-col gap-4">
      <div v-for="(row, index) in dragList" :key="getRowId(row)"
        class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg bg-surface-0 dark:bg-surface-900/50 flex flex-col gap-4 relative group transition-all hover:border-primary-300 dark:hover:border-primary-700">

        <div class="absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button class="drag-handle cursor-grab active:cursor-grabbing" severity="secondary" rounded aria-label="Drag"
            size="small">
            <template #icon>
              <GripVertical class="w-3 h-3 text-surface-500" />
            </template>
          </Button>
        </div>

        <div class="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button severity="danger" rounded aria-label="Remove" size="small" @click="removeRow(index)">
            <template #icon>
              <X class="w-3 h-3" />
            </template>
          </Button>
        </div>

        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex flex-col gap-1.5 flex-1 w-full">
            <label :for="`issue-title-${index}`"
              class="text-xs font-bold uppercase text-surface-500 tracking-wider">Issue Title</label>
            <InputText :id="`issue-title-${index}`" v-model="row.title" class="w-full text-sm"
              placeholder="e.g. Game crashes on startup" />
          </div>

          <div class="flex flex-col gap-1.5 w-full md:w-56">
            <label :for="`issue-status-${index}`"
              class="text-xs font-bold uppercase text-surface-500 tracking-wider">Status</label>
            <Select :inputId="`issue-status-${index}`" :modelValue="getStatus(row)"
              @update:modelValue="setStatus(row, $event)" :options="STATUS_OPTIONS" optionLabel="label"
              optionValue="value" class="w-full text-sm" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">Description</label>
          <WysiwygEditor v-model="row.body" placeholder="Describe the issue and how to reproduce or fix it..."
            class="w-full" />
        </div>
      </div>
    </VueDraggable>

    <Button label="Add Issue" severity="secondary" outlined class="w-full border-dashed" @click="addRow">
      <template #icon>
        <Plus class="w-4 h-4" />
      </template>
    </Button>

    <div class="mt-2 rounded border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
      <button type="button" @click="guidelinesOpen = !guidelinesOpen"
        class="w-full flex items-center gap-2 p-3 text-xs font-bold text-left">
        <Info class="w-4 h-4 shrink-0" />
        <span class="flex-1">Issue Guidelines</span>
        <ChevronDown class="w-4 h-4 shrink-0 transition-transform" :class="{ 'rotate-180': guidelinesOpen }" />
      </button>
      <div v-if="guidelinesOpen" class="px-3 pb-3 pl-9 text-xs">
        <ul class="list-disc pl-4 flex flex-col gap-1">
          <li>Titles should be clear and concise.</li>
          <li>Set the status to anything other than "Open" once the issue has been resolved in a later patch or has a
            confirmed user workaround that completely fixes it.</li>
          <li>Provide detailed steps for any workarounds in the description.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
