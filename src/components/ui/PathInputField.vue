<script setup lang="ts">
import { ref, watch } from 'vue';
import Chip from 'primevue/chip';
import { getSpecialPathByValue } from '../../utils/specialPaths';

const props = defineProps<{
    modelValue: string;
    id?: string;
    placeholder?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

interface Segment {
    id: number;
    isTag: boolean;
    value: string;
}

let nextId = 0;
const segments = ref<Segment[]>([]);
const lastFocused = ref<{ index: number; caret: number } | null>(null);
const inputRefs = ref<HTMLInputElement[]>([]);

const parseSegments = (str: string) => {
    const parts = str.split(/(\{\{p\|.*?\}\})/i);
    const newSegments: Segment[] = [];
    
    parts.forEach(part => {
        if (/^\{\{p\|.*?\}\}$/i.test(part)) {
            // It's a tag
            if (newSegments.length === 0 || newSegments[newSegments.length - 1].isTag) {
                newSegments.push({ id: nextId++, isTag: false, value: '' });
            }
            newSegments.push({ id: nextId++, isTag: true, value: part });
        } else {
            // It's text
            if (newSegments.length > 0 && !newSegments[newSegments.length - 1].isTag) {
                newSegments[newSegments.length - 1].value += part;
            } else {
                newSegments.push({ id: nextId++, isTag: false, value: part });
            }
        }
    });

    if (newSegments.length === 0 || newSegments[newSegments.length - 1].isTag) {
        newSegments.push({ id: nextId++, isTag: false, value: '' });
    }
    
    if (newSegments.length > 0 && newSegments[0].isTag) {
        newSegments.unshift({ id: nextId++, isTag: false, value: '' });
    }

    return newSegments;
};

segments.value = parseSegments(props.modelValue);

watch(() => props.modelValue, (newVal) => {
    const currentStr = segments.value.map(s => s.value).join('');
    if (newVal !== currentStr) {
        segments.value = parseSegments(newVal);
    }
});

const onInput = () => {
    const newStr = segments.value.map(s => s.value).join('');
    
    const parsed = parseSegments(newStr);
    if (parsed.length !== segments.value.length) {
        segments.value = parsed;
    }
    
    emit('update:modelValue', newStr);
};

const getLabel = (val: string) => {
    const special = getSpecialPathByValue(val);
    return special ? special.label : val;
};

const removeSegment = (index: number) => {
    segments.value.splice(index, 1);
    
    // Merge adjacent text segments
    for (let i = 0; i < segments.value.length - 1; i++) {
        if (!segments.value[i].isTag && !segments.value[i+1].isTag) {
            segments.value[i].value += segments.value[i+1].value;
            segments.value.splice(i + 1, 1);
            i--;
        }
    }
    
    if (segments.value.length === 0) {
        segments.value.push({ id: nextId++, isTag: false, value: '' });
    }
    
    onInput();
};

const updateSelection = (index: number, e: Event) => {
    const target = e.target as HTMLInputElement;
    lastFocused.value = { index, caret: target.selectionStart || 0 };
};

const setInputRef = (el: any, index: number) => {
    if (el) {
        inputRefs.value[index / 2] = el as HTMLInputElement;
    }
};

const onKeydown = (index: number, event: KeyboardEvent) => {
    const target = event.target as HTMLInputElement;
    
    if (event.key === 'Backspace' && target.selectionStart === 0 && target.selectionEnd === 0 && index > 0) {
        if (segments.value[index - 1].isTag) {
            event.preventDefault();
            removeSegment(index - 1);
            
            setTimeout(() => {
                const newIndex = (index / 2) - 1;
                if (inputRefs.value[newIndex]) {
                    inputRefs.value[newIndex].focus();
                }
            }, 0);
        }
    } else if (event.key === 'ArrowLeft' && target.selectionStart === 0 && target.selectionEnd === 0 && index > 0) {
        event.preventDefault();
        const prevInputIndex = (index / 2) - 1;
        if (inputRefs.value[prevInputIndex]) {
            inputRefs.value[prevInputIndex].focus();
            const len = inputRefs.value[prevInputIndex].value.length;
            inputRefs.value[prevInputIndex].setSelectionRange(len, len);
        }
    } else if (event.key === 'ArrowRight' && target.selectionStart === target.value.length && index < segments.value.length - 1) {
        event.preventDefault();
        const nextInputIndex = (index / 2) + 1;
        if (inputRefs.value[nextInputIndex]) {
            inputRefs.value[nextInputIndex].focus();
            inputRefs.value[nextInputIndex].setSelectionRange(0, 0);
        }
    }
};

const insertAtCaret = (text: string) => {
    let newStr = '';
    if (lastFocused.value && segments.value[lastFocused.value.index]) {
        const { index, caret } = lastFocused.value;
        const seg = segments.value[index];
        seg.value = seg.value.substring(0, caret) + text + seg.value.substring(caret);
        lastFocused.value.caret += text.length;
    } else {
        const lastIndex = segments.value.length - 1;
        if (lastIndex >= 0 && !segments.value[lastIndex].isTag) {
            segments.value[lastIndex].value += text;
        } else {
            segments.value.push({ id: nextId++, isTag: false, value: text });
        }
    }
    
    newStr = segments.value.map(s => s.value).join('');
    segments.value = parseSegments(newStr);
    emit('update:modelValue', newStr);
};

defineExpose({ insertAtCaret });

const containerRef = ref<HTMLElement | null>(null);

const focusContainer = (e: MouseEvent) => {
    if (containerRef.value && e.target === containerRef.value) {
        const inputs = containerRef.value.querySelectorAll('input');
        if (inputs.length) {
            (inputs[inputs.length - 1] as HTMLInputElement).focus();
        }
    }
};

</script>

<template>
  <div 
    ref="containerRef"
    class="flex flex-nowrap items-center p-inputtext h-auto! w-full cursor-text px-2! py-0! transition-colors duration-200 overflow-x-auto no-scrollbar" 
    :id="id"
    @click="focusContainer"
  >
    <template v-for="(seg, idx) in segments" :key="seg.id">
      <Chip 
        v-if="seg.isTag" 
        :label="getLabel(seg.value)" 
        removable 
        @remove="removeSegment(idx)" 
        class="text-xs h-[22px] shrink-0 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300" 
      />
      <input 
        v-else 
        type="text" 
        :ref="(el) => setInputRef(el, idx)"
        v-model="seg.value" 
        @input="onInput" 
        @keydown="onKeydown(idx, $event)" 
        @focus="updateSelection(idx, $event)"
        @blur="updateSelection(idx, $event)"
        @keyup="updateSelection(idx, $event)"
        @click="updateSelection(idx, $event)"
        class="outline-none bg-transparent font-mono text-sm leading-none m-0 py-1.5 text-surface-700 dark:text-surface-0 placeholder:text-surface-400 dark:placeholder:text-surface-500 shrink-0" 
        :style="{ width: seg.value.length ? `${seg.value.length}ch` : '2px' }"
        :class="{ 'min-w-[50px] flex-1': idx === segments.length - 1 && segments.length === 1 }"
        :placeholder="idx === segments.length - 1 && segments.length === 1 ? placeholder : ''"
      />
    </template>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
