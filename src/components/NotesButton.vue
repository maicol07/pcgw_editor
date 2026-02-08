<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import { Book, MessageSquare } from 'lucide-vue-next';
import NotesEditorDialog from './common/NotesEditorDialog.vue';

const props = defineProps<{
  modelValue?: string;
  type?: 'note' | 'ref';
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const visible = ref(false);

const hasContent = computed(() => !!props.modelValue && props.modelValue.trim().length > 0);
const icon = computed(() => props.type === 'ref' ? Book : MessageSquare);

const tooltipText = computed(() => {
  if (props.type === 'ref') {
    return hasContent.value ? 'Edit references' : 'Add references';
  }
  return hasContent.value ? 'Edit Notes' : 'Add Notes';
});
</script>

<template>
  <div class="inline-block">
    <Button :severity="hasContent ? 'primary' : 'secondary'" :variant="hasContent ? 'filled' : 'outlined'" rounded text
      size="small" class="w-full h-full !p-0 flex items-center justify-center" v-tooltip.top="tooltipText"
      @click="visible = true">
      <component :is="icon" class="!w-[17px] !h-[17px]" />
    </Button>

    <NotesEditorDialog v-model:visible="visible" :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)" :type="type" :title="title" />
  </div>
</template>
