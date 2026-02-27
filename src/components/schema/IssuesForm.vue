<script setup lang="ts">
import { Issue } from '../../models/GameData';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import { X, Plus, Info, GripVertical } from 'lucide-vue-next';
import WysiwygEditor from '../common/WysiwygEditor.vue';
import { VueDraggable } from 'vue-draggable-plus';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: Issue[];
}>();

const emit = defineEmits(['update:modelValue']);

const dragList = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
});

const idMap = new WeakMap<Issue, number>();
let nextId = 0;
function getRowId(row: Issue) {
  if (!idMap.has(row)) idMap.set(row, nextId++);
  return idMap.get(row)!;
}

function addRow() {
  const newRows = [...(props.modelValue || []), { title: '', fixed: false, body: '' }];
  emit('update:modelValue', newRows);
}

function removeRow(index: number) {
  const newRows = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', newRows);
}
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
            <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">Issue Title</label>
            <InputText v-model="row.title" class="w-full text-sm" placeholder="e.g. Game crashes on startup" />
          </div>

          <div class="flex items-center gap-2 mb-2">
            <Checkbox v-model="row.fixed" :binary="true" :inputId="`fixed-${index}`" />
            <label :for="`fixed-${index}`"
              class="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer">Fixed</label>
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

    <div
      class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 flex gap-3 text-xs text-blue-700 dark:text-blue-300">
      <Info class="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        <p class="font-bold mb-1">Issue Guidelines:</p>
        <ul class="list-disc pl-4 flex flex-col gap-1">
          <li>Titles should be clear and concise.</li>
          <li>Check the "Fixed" box if the issue has been resolved in a later patch or has a confirmed user workaround
            that
            completely fixes it.</li>
          <li>Provide detailed steps for any workarounds in the description.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
