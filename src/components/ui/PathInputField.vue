<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
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
    isTag: boolean;
    value: string;
}

const editorRef = ref<HTMLDivElement | null>(null);

const parseSegments = (str: string): Segment[] => {
    if (!str) return [];
    const parts = str.split(/(\{\{p\|.*?\}\})/i);
    const result: Segment[] = [];
    parts.forEach(part => {
        if (!part) return;
        if (/^\{\{p\|.*?\}\}$/i.test(part)) {
            result.push({ isTag: true, value: part });
        } else {
            result.push({ isTag: false, value: part });
        }
    });
    return result;
};

const getLabel = (val: string) => {
    const special = getSpecialPathByValue(val);
    return special ? special.label : val;
};

function serializeDOM(): string {
    if (!editorRef.value) return '';
    let result = '';
    editorRef.value.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            if (el.hasAttribute('data-token')) {
                result += el.getAttribute('data-token') || '';
            } else {
                result += el.textContent || '';
            }
        } else if (child.nodeType === Node.TEXT_NODE) {
            result += child.textContent || '';
        }
    });
    return result;
}

function removeTokenAtIndex(idx: number) {
    const segs = parseSegments(props.modelValue);
    if (segs[idx]?.isTag) {
        segs.splice(idx, 1);
        const newStr = segs.map(s => s.value).join('');
        emit('update:modelValue', newStr);
        renderDOM(newStr);
    }
}

function renderDOM(val: string) {
    if (!editorRef.value) return;
    editorRef.value.innerHTML = '';
    const segs = parseSegments(val);

    segs.forEach((seg, idx) => {
        if (seg.isTag) {
            const chip = document.createElement('span');
            chip.className = 'chip-token inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-sans font-medium mx-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 shrink-0 select-none';
            chip.contentEditable = 'false';
            chip.draggable = false;
            chip.setAttribute('data-token', seg.value);

            const label = document.createElement('span');
            label.textContent = getLabel(seg.value);
            chip.appendChild(label);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'chip-remove-btn hover:text-red-500 rounded-full w-3.5 h-3.5 flex items-center justify-center -mr-0.5 cursor-pointer text-xs leading-none';
            removeBtn.setAttribute('aria-label', `Remove ${getLabel(seg.value)}`);
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                removeTokenAtIndex(idx);
            });
            chip.appendChild(removeBtn);

            chip.addEventListener('dragstart', (e) => e.preventDefault());

            editorRef.value!.appendChild(chip);
        } else {
            const textNode = document.createTextNode(seg.value);
            editorRef.value!.appendChild(textNode);
        }
    });
}

function getOffsetForPoint(node: Node | null, offset: number): number {
    if (!node || !editorRef.value) return 0;
    if (node === editorRef.value) {
        let total = 0;
        const children = Array.from(editorRef.value.childNodes);
        for (let i = 0; i < offset && i < children.length; i++) {
            const child = children[i];
            if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).hasAttribute('data-token')) {
                total += (child as HTMLElement).getAttribute('data-token')?.length || 0;
            } else if (child.nodeType === Node.TEXT_NODE) {
                total += child.textContent?.length || 0;
            }
        }
        return total;
    }

    let total = 0;
    const children = Array.from(editorRef.value.childNodes);
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child === node || child.contains(node)) {
            if (child.nodeType === Node.TEXT_NODE) {
                total += offset;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const token = (child as HTMLElement).getAttribute('data-token') || '';
                total += offset > 0 ? token.length : 0;
            }
            return total;
        }

        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).hasAttribute('data-token')) {
            total += (child as HTMLElement).getAttribute('data-token')?.length || 0;
        } else if (child.nodeType === Node.TEXT_NODE) {
            total += child.textContent?.length || 0;
        }
    }
    return total;
}

function getNodeAndOffsetForChar(targetOffset: number): { node: Node; offset: number } {
    if (!editorRef.value) return { node: document.body, offset: 0 };

    let currentOffset = 0;
    const children = Array.from(editorRef.value.childNodes);

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).hasAttribute('data-token')) {
            const token = (child as HTMLElement).getAttribute('data-token') || '';
            const len = token.length;
            if (targetOffset <= currentOffset + len) {
                return {
                    node: editorRef.value,
                    offset: targetOffset <= currentOffset ? i : i + 1
                };
            }
            currentOffset += len;
        } else if (child.nodeType === Node.TEXT_NODE) {
            const len = child.textContent?.length || 0;
            if (targetOffset <= currentOffset + len) {
                return {
                    node: child,
                    offset: Math.max(0, Math.min(targetOffset - currentOffset, len))
                };
            }
            currentOffset += len;
        }
    }

    return {
        node: editorRef.value,
        offset: children.length
    };
}

function setSelectionOffsets(anchorOffset: number, focusOffset: number) {
    if (!editorRef.value) return;
    const sel = window.getSelection();
    if (!sel) return;

    const anchor = getNodeAndOffsetForChar(anchorOffset);
    const focus = getNodeAndOffsetForChar(focusOffset);

    try {
        sel.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
    } catch {
        const range = document.createRange();
        const min = Math.min(anchorOffset, focusOffset);
        const max = Math.max(anchorOffset, focusOffset);
        const start = getNodeAndOffsetForChar(min);
        const end = getNodeAndOffsetForChar(max);
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    onSelectionChange();
}

function getCaretOffset(): number {
    if (!editorRef.value) return 0;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.value.contains(selection.anchorNode)) {
        return props.modelValue.length;
    }
    return getOffsetForPoint(selection.focusNode, selection.focusOffset);
}

function setCaretOffset(targetOffset: number) {
    setSelectionOffsets(targetOffset, targetOffset);
}

function getOffsetFromCoordinates(x: number, y: number): number {
    if (!editorRef.value) return 0;
    const rect = editorRef.value.getBoundingClientRect();
    if (x <= rect.left) return 0;
    if (x >= rect.right) return props.modelValue.length;

    if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos && editorRef.value.contains(pos.offsetNode)) {
            return getOffsetForPoint(pos.offsetNode, pos.offset);
        }
    }
    if ((document as any).caretRangeFromPoint) {
        const range = (document as any).caretRangeFromPoint(x, y);
        if (range && editorRef.value.contains(range.startContainer)) {
            return getOffsetForPoint(range.startContainer, range.startOffset);
        }
    }

    return getCaretOffset();
}

function onSelectionChange() {
    if (!editorRef.value) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.value.contains(selection.anchorNode)) {
        editorRef.value.querySelectorAll('.chip-token.chip-selected').forEach(el => el.classList.remove('chip-selected'));
        return;
    }

    if (selection.isCollapsed) {
        editorRef.value.querySelectorAll('.chip-token.chip-selected').forEach(el => el.classList.remove('chip-selected'));
        return;
    }

    const start = getOffsetForPoint(selection.anchorNode, selection.anchorOffset);
    const end = getOffsetForPoint(selection.focusNode, selection.focusOffset);
    const min = Math.min(start, end);
    const max = Math.max(start, end);

    let currentOffset = 0;
    editorRef.value.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).hasAttribute('data-token')) {
            const chip = child as HTMLElement;
            const token = chip.getAttribute('data-token') || '';
            const chipStart = currentOffset;
            const chipEnd = currentOffset + token.length;

            if (max > chipStart && min < chipEnd) {
                chip.classList.add('chip-selected');
            } else {
                chip.classList.remove('chip-selected');
            }
            currentOffset += token.length;
        } else if (child.nodeType === Node.TEXT_NODE) {
            currentOffset += child.textContent?.length || 0;
        }
    });
}

function getTokenAtOrAdjacent(offset: number) {
    let current = 0;
    const segs = parseSegments(props.modelValue);
    for (const seg of segs) {
        const next = current + seg.value.length;
        if (seg.isTag) {
            if (offset > current && offset < next) {
                return { start: current, end: next, isInside: true };
            }
            if (offset === next) {
                return { start: current, end: next, isAtEnd: true };
            }
            if (offset === current) {
                return { start: current, end: next, isAtStart: true };
            }
        }
        current = next;
    }
    return null;
}

function getTokenForCharIndex(index: number) {
    let current = 0;
    const segs = parseSegments(props.modelValue);
    for (const seg of segs) {
        const next = current + seg.value.length;
        if (seg.isTag && index >= current && index < next) {
            return { start: current, end: next };
        }
        current = next;
    }
    return null;
}

function getWordBoundary(str: string, offset: number, direction: 'left' | 'right'): number {
    const isSep = (c: string) => /[\\/.:\-_ ]/.test(c);

    if (direction === 'right') {
        if (offset >= str.length) return str.length;

        const tokenAtCursor = getTokenAtOrAdjacent(offset);
        if (tokenAtCursor && (tokenAtCursor.isAtStart || tokenAtCursor.isInside)) {
            return tokenAtCursor.end;
        }

        let i = offset;
        while (i < str.length && isSep(str[i])) {
            const t = getTokenForCharIndex(i);
            if (t) return t.start;
            i++;
        }

        if (i < str.length) {
            const t = getTokenForCharIndex(i);
            if (t) return t.end;
        }

        while (i < str.length && !isSep(str[i])) {
            const t = getTokenForCharIndex(i);
            if (t) return t.start;
            i++;
        }

        return Math.min(str.length, i);
    } else {
        if (offset <= 0) return 0;

        const tokenAtCursor = getTokenAtOrAdjacent(offset);
        if (tokenAtCursor && (tokenAtCursor.isAtEnd || tokenAtCursor.isInside)) {
            return tokenAtCursor.start;
        }

        let i = offset - 1;
        while (i >= 0 && isSep(str[i])) {
            const t = getTokenForCharIndex(i);
            if (t) return t.end;
            i--;
        }

        if (i >= 0) {
            const t = getTokenForCharIndex(i);
            if (t) return t.start;
        }

        while (i >= 0 && !isSep(str[i])) {
            const t = getTokenForCharIndex(i);
            if (t) return t.end;
            i--;
        }

        return Math.max(0, i + 1);
    }
}

const onMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chip-remove-btn')) return;

    let isMouseDragging = true;
    const dragAnchorOffset = getOffsetFromCoordinates(e.clientX, e.clientY);
    setSelectionOffsets(dragAnchorOffset, dragAnchorOffset);

    const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isMouseDragging) return;
        const currentOffset = getOffsetFromCoordinates(moveEvent.clientX, moveEvent.clientY);
        setSelectionOffsets(dragAnchorOffset, currentOffset);
    };

    const onMouseUp = () => {
        isMouseDragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
};

const onInput = () => {
    const newStr = serializeDOM();
    const oldSegs = parseSegments(props.modelValue);
    const newSegs = parseSegments(newStr);
    const tagsChanged = oldSegs.some((s, i) => s.isTag !== newSegs[i]?.isTag || (s.isTag && s.value !== newSegs[i]?.value))
        || oldSegs.length !== newSegs.length;

    if (tagsChanged) {
        const caret = getCaretOffset();
        emit('update:modelValue', newStr);
        renderDOM(newStr);
        setCaretOffset(caret);
    } else {
        emit('update:modelValue', newStr);
    }
};

const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        return;
    }

    const selection = window.getSelection();
    const isEditorActive = editorRef.value && selection && editorRef.value.contains(selection.anchorNode);

    // Ctrl+A / Cmd+A
    if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setSelectionOffsets(0, props.modelValue.length);
        return;
    }

    // Home / End
    if (e.key === 'Home' && isEditorActive && selection) {
        e.preventDefault();
        const anchor = e.shiftKey ? getOffsetForPoint(selection.anchorNode, selection.anchorOffset) : 0;
        setSelectionOffsets(anchor, 0);
        return;
    }

    if (e.key === 'End' && isEditorActive && selection) {
        e.preventDefault();
        const len = props.modelValue.length;
        const anchor = e.shiftKey ? getOffsetForPoint(selection.anchorNode, selection.anchorOffset) : len;
        setSelectionOffsets(anchor, len);
        return;
    }

    // ArrowLeft and ArrowRight navigation and Shift / Ctrl selection
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && isEditorActive && selection) {
        e.preventDefault();
        const anchor = getOffsetForPoint(selection.anchorNode, selection.anchorOffset);
        const focus = getOffsetForPoint(selection.focusNode, selection.focusOffset);
        const isWordJump = e.ctrlKey || e.metaKey || e.altKey;

        if (e.shiftKey) {
            let newFocus = focus;
            if (e.key === 'ArrowLeft') {
                if (isWordJump) {
                    newFocus = getWordBoundary(props.modelValue, focus, 'left');
                } else {
                    if (newFocus > 0) {
                        const token = getTokenAtOrAdjacent(newFocus);
                        if (token && (token.isAtEnd || token.isInside)) {
                            newFocus = token.start;
                        } else {
                            newFocus--;
                        }
                    }
                }
            } else {
                if (isWordJump) {
                    newFocus = getWordBoundary(props.modelValue, focus, 'right');
                } else {
                    if (newFocus < props.modelValue.length) {
                        const token = getTokenAtOrAdjacent(newFocus);
                        if (token && (token.isAtStart || token.isInside)) {
                            newFocus = token.end;
                        } else {
                            newFocus++;
                        }
                    }
                }
            }
            setSelectionOffsets(anchor, newFocus);
        } else {
            if (!selection.isCollapsed && !isWordJump) {
                const target = e.key === 'ArrowLeft' ? Math.min(anchor, focus) : Math.max(anchor, focus);
                setSelectionOffsets(target, target);
            } else {
                let target = focus;
                if (e.key === 'ArrowLeft') {
                    if (isWordJump) {
                        target = getWordBoundary(props.modelValue, focus, 'left');
                    } else {
                        if (target > 0) {
                            const token = getTokenAtOrAdjacent(target);
                            if (token && (token.isAtEnd || token.isInside)) {
                                target = token.start;
                            } else {
                                target--;
                            }
                        }
                    }
                } else {
                    if (isWordJump) {
                        target = getWordBoundary(props.modelValue, focus, 'right');
                    } else {
                        if (target < props.modelValue.length) {
                            const token = getTokenAtOrAdjacent(target);
                            if (token && (token.isAtStart || token.isInside)) {
                                target = token.end;
                            } else {
                                target++;
                            }
                        }
                    }
                }
                setSelectionOffsets(target, target);
            }
        }
        return;
    }

    // Backspace or Delete with an active range selection
    if ((e.key === 'Backspace' || e.key === 'Delete') && isEditorActive && selection && !selection.isCollapsed) {
        e.preventDefault();
        const start = getOffsetForPoint(selection.anchorNode, selection.anchorOffset);
        const end = getOffsetForPoint(selection.focusNode, selection.focusOffset);
        const min = Math.min(start, end);
        const max = Math.max(start, end);

        const newVal = props.modelValue.slice(0, min) + props.modelValue.slice(max);
        emit('update:modelValue', newVal);
        renderDOM(newVal);
        setCaretOffset(min);
        return;
    }

    // Backspace with collapsed caret right after a chip token
    if (e.key === 'Backspace' && isEditorActive && selection && selection.isCollapsed) {
        const caret = getCaretOffset();
        if (caret > 0) {
            const token = getTokenAtOrAdjacent(caret);
            if (token && token.isAtEnd) {
                e.preventDefault();
                const newVal = props.modelValue.slice(0, token.start) + props.modelValue.slice(token.end);
                emit('update:modelValue', newVal);
                renderDOM(newVal);
                setCaretOffset(token.start);
                return;
            }
        }
    }

    // Delete with collapsed caret right before a chip token
    if (e.key === 'Delete' && isEditorActive && selection && selection.isCollapsed) {
        const caret = getCaretOffset();
        if (caret < props.modelValue.length) {
            const token = getTokenAtOrAdjacent(caret);
            if (token && token.isAtStart) {
                e.preventDefault();
                const newVal = props.modelValue.slice(0, token.start) + props.modelValue.slice(token.end);
                emit('update:modelValue', newVal);
                renderDOM(newVal);
                setCaretOffset(token.start);
                return;
            }
        }
    }

    // Overwriting active range selection with typed character
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && isEditorActive && selection && !selection.isCollapsed) {
        e.preventDefault();
        const start = getOffsetForPoint(selection.anchorNode, selection.anchorOffset);
        const end = getOffsetForPoint(selection.focusNode, selection.focusOffset);
        const min = Math.min(start, end);
        const max = Math.max(start, end);

        const newVal = props.modelValue.slice(0, min) + e.key + props.modelValue.slice(max);
        emit('update:modelValue', newVal);
        renderDOM(newVal);
        setCaretOffset(min + 1);
        return;
    }
};

const onCopy = (e: ClipboardEvent) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.value) return;

    if (selection.isCollapsed) {
        e.clipboardData?.setData('text/plain', props.modelValue);
        e.preventDefault();
        return;
    }

    const start = getOffsetForPoint(selection.anchorNode, selection.anchorOffset);
    const end = getOffsetForPoint(selection.focusNode, selection.focusOffset);
    const min = Math.min(start, end);
    const max = Math.max(start, end);

    const selectedText = props.modelValue.slice(min, max);
    e.clipboardData?.setData('text/plain', selectedText);
    e.preventDefault();
};

const onCut = (e: ClipboardEvent) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.value) return;

    const start = getOffsetForPoint(selection.anchorNode, selection.anchorOffset);
    const end = getOffsetForPoint(selection.focusNode, selection.focusOffset);
    const min = Math.min(start, end);
    const max = Math.max(start, end);

    const selectedText = props.modelValue.slice(min, max);
    e.clipboardData?.setData('text/plain', selectedText);
    e.preventDefault();

    const newVal = props.modelValue.slice(0, min) + props.modelValue.slice(max);
    emit('update:modelValue', newVal);
    renderDOM(newVal);
    setCaretOffset(min);
};

const onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData('text/plain') || '').replace(/\r?\n/g, '');
    if (!pasted) return;

    const selection = window.getSelection();
    let min = 0;
    let max = 0;
    if (selection && !selection.isCollapsed && editorRef.value?.contains(selection.anchorNode)) {
        const start = getOffsetForPoint(selection.anchorNode, selection.anchorOffset);
        const end = getOffsetForPoint(selection.focusNode, selection.focusOffset);
        min = Math.min(start, end);
        max = Math.max(start, end);
    } else {
        min = max = getCaretOffset();
    }

    const newVal = props.modelValue.slice(0, min) + pasted + props.modelValue.slice(max);
    emit('update:modelValue', newVal);
    renderDOM(newVal);
    setCaretOffset(min + pasted.length);
};

const insertAtCaret = (text: string) => {
    let caret = getCaretOffset();
    if (!editorRef.value || !document.activeElement || !editorRef.value.contains(document.activeElement)) {
        caret = props.modelValue.length;
    }
    const newVal = props.modelValue.slice(0, caret) + text + props.modelValue.slice(caret);
    emit('update:modelValue', newVal);
    renderDOM(newVal);
    setCaretOffset(caret + text.length);
};

defineExpose({ insertAtCaret });

watch(() => props.modelValue, (newVal) => {
    const currentStr = serializeDOM();
    if (newVal !== currentStr) {
        const caret = getCaretOffset();
        renderDOM(newVal);
        if (editorRef.value && (document.activeElement === editorRef.value || editorRef.value.contains(document.activeElement))) {
            setCaretOffset(caret);
        }
    }
});

onMounted(() => {
    renderDOM(props.modelValue);
    document.addEventListener('selectionchange', onSelectionChange);
});

onUnmounted(() => {
    document.removeEventListener('selectionchange', onSelectionChange);
});
</script>

<template>
  <div
    ref="editorRef"
    v-bind="$attrs"
    :id="id"
    contenteditable="true"
    role="textbox"
    spellcheck="false"
    class="path-input-editor flex flex-nowrap items-center p-inputtext h-auto! min-h-8 w-full cursor-text px-2! py-1! transition-colors duration-200 overflow-x-auto no-scrollbar font-mono text-sm outline-none whitespace-nowrap"
    :data-placeholder="placeholder"
    @mousedown="onMouseDown"
    @keydown="onKeydown"
    @input="onInput"
    @copy="onCopy"
    @cut="onCut"
    @paste="onPaste"
  />
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.path-input-editor:empty::before {
  content: attr(data-placeholder);
  color: var(--p-surface-400, #9ca3af);
  pointer-events: none;
}

:deep(.chip-token) {
  user-select: none;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

:deep(.chip-token.chip-selected) {
  background-color: var(--p-primary-500, #3b82f6) !important;
  color: #ffffff !important;
  box-shadow: 0 0 0 2px var(--p-primary-400, #60a5fa) !important;
}

:deep(.chip-token.chip-selected *) {
  color: #ffffff !important;
}
</style>
