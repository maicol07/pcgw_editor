<script setup lang="ts">
import { SettingsVideo } from '../../models/GameData';
import ScreenshotAnalysis from '../common/ScreenshotAnalysis.vue';

const props = defineProps<{
  modelValue: SettingsVideo;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: SettingsVideo): void;
}>();
</script>

<template>
  <ScreenshotAnalysis
    :modelValue="props.modelValue"
    section="video"
    label="AI Screenshot Analysis"
    description="Paste or upload a settings screenshot to auto-fill"
    @update:modelValue="(val) => emit('update:modelValue', val as SettingsVideo)"
  />
</template>
