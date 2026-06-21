<script setup lang="ts">
// Shared snippet-tool buttons for the WYSIWYG and Source toolbars.
// Emits a descriptor; the parent (WysiwygEditor) opens the matching dialog.
// `.custom-action-btn` is styled globally by WysiwygEditor's <style> block.
import { ListChecks, Link2, MessageSquareWarning, FileText, Globe, Keyboard, Wrench } from 'lucide-vue-next';

export type SnippetAction = { kind: 'ref'; type: string } | { kind: 'fixbox' };

defineEmits<{ (e: 'action', payload: SnippetAction): void }>();

const groups: { label: string; tools: { tip: string; icon: any; iconClass?: string; payload: SnippetAction }[] }[] = [
    { label: 'Citations', tools: [
        { tip: 'Refcheck', icon: ListChecks, payload: { kind: 'ref', type: 'Refcheck' } },
        { tip: 'Refurl', icon: Link2, payload: { kind: 'ref', type: 'Refurl' } },
        { tip: 'Citation', icon: MessageSquareWarning, payload: { kind: 'ref', type: 'cn' } },
    ] },
    { label: 'Links', tools: [
        { tip: 'Page Link', icon: FileText, payload: { kind: 'ref', type: 'ilink' } },
        { tip: 'Wiki Link', icon: Globe, payload: { kind: 'ref', type: 'wlink' } },
    ] },
    { label: 'Formatting', tools: [
        { tip: 'Key', icon: Keyboard, payload: { kind: 'ref', type: 'key' } },
    ] },
    { label: 'Tools', tools: [
        { tip: 'Fixbox', icon: Wrench, iconClass: 'text-orange-500', payload: { kind: 'fixbox' } },
    ] },
];
</script>

<template>
    <div class="flex flex-wrap items-center gap-y-1">
        <template v-for="(group, gi) in groups" :key="group.label">
            <div v-if="gi > 0" class="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1"></div>
            <div class="flex items-center gap-0.5">
                <span class="text-2xs font-bold text-surface-400 dark:text-surface-500 uppercase leading-none mr-1.5">{{ group.label }}</span>
                <button v-for="tool in group.tools" :key="tool.tip" type="button" v-tooltip.top="tool.tip"
                    class="custom-action-btn" @click="$emit('action', tool.payload)">
                    <component :is="tool.icon" class="w-4 h-4" :class="tool.iconClass" />
                </button>
            </div>
        </template>
    </div>
</template>
