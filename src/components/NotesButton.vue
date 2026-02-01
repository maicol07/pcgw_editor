<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import AutoComplete from 'primevue/autocomplete';
import Toolbar from 'primevue/toolbar';
import { renderWikitextToHtml } from '../utils/renderer';

const props = defineProps<{
  modelValue?: string;
  type?: 'note' | 'ref';
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const visible = ref(false);
const localValue = ref('');

// Reference Logic
interface ReferenceItem {
    id: string; // internal id for v-for key
    type: 'Refcheck' | 'Refurl' | 'cn' | 'text';
    params: Record<string, string>;
    content?: string; // for 'text' type
}

const references = ref<ReferenceItem[]>([]);

const parseReferences = (text: string): ReferenceItem[] => {
    const refs: ReferenceItem[] = [];
    if (!text) return refs;

    const regex = /{{(Refcheck|Refurl|cn)([^}]*)}}|([^{]+)/g;
    let match;
    
    if (!text.includes('{{')) {
         refs.push({ id: crypto.randomUUID(), type: 'text', params: {}, content: text });
         return refs;
    }

    while ((match = regex.exec(text)) !== null) {
        if (match[3]) {
             if (match[3].trim()) {
                 refs.push({ id: crypto.randomUUID(), type: 'text', params: {}, content: match[3] });
             }
        } else {
             const type = match[1] as 'Refcheck' | 'Refurl' | 'cn';
             const paramStr = match[2];
             const params: Record<string, string> = {};
             
             if (paramStr) {
                 const paramPairs = paramStr.split('|');
                 paramPairs.forEach(p => {
                     if (!p.trim()) return;
                     const [key, val] = p.split('=');
                     if (key && val !== undefined) {
                         params[key.trim()] = val.trim();
                     }
                 });
             }
             refs.push({ id: crypto.randomUUID(), type, params });
        }
    }
    return refs;
};

const serializeReferences = (refs: ReferenceItem[]): string => {
    return refs.map(r => {
        if (r.type === 'text') return r.content || '';
        
        const params = Object.entries(r.params)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}=${v}`)
            .join('|');
            
        return `{{${r.type}${params ? '|' + params : ''}}}`;
    }).join(' ');
};

const openDialog = () => {
  localValue.value = props.modelValue || '';
  if (props.type === 'ref') {
      references.value = parseReferences(localValue.value);
  }
  visible.value = true;
};

const save = () => {
  if (props.type === 'ref') {
      localValue.value = serializeReferences(references.value);
  }
  emit('update:modelValue', localValue.value);
  visible.value = false;
};

const addReference = (type: 'Refcheck' | 'Refurl' | 'cn') => {
    const params: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'Refcheck') {
        params.user = 'User';
        params.date = today;
    } else if (type === 'Refurl') {
        params.date = today;
        params.url = '';
        params.title = '';
    } else if (type === 'cn') {
        params.date = today;
    }
    
    references.value.push({
        id: crypto.randomUUID(),
        type,
        params
    });
};

const removeReference = (index: number) => {
    references.value.splice(index, 1);
};

// User Autocomplete Logic
const userSuggestions = ref<string[]>([]);
const searchUser = async (event: { query: string }) => {
    if (!event.query || event.query.length < 2) return;
    try {
        const response = await fetch(`https://www.pcgamingwiki.com/w/api.php?action=query&list=allusers&auprefix=${event.query}&format=json&origin=*`);
        const data = await response.json();
        if (data.query && data.query.allusers) {
            userSuggestions.value = data.query.allusers.map((u: any) => u.name);
        }
    } catch (e) {
        console.error("Failed to fetch users", e);
    }
};

const hasContent = computed(() => !!props.modelValue && props.modelValue.trim().length > 0);
const icon = computed(() => {
    if (props.type === 'ref') return 'pi pi-book'; 
    return 'pi pi-comment';
});

const tooltipText = computed(() => {
    if (props.type === 'ref') {
        return hasContent.value ? 'Edit references' : 'Add references';
    }
    return hasContent.value ? 'Edit Notes' : 'Add Notes';
});

// Live Preview for Notes
const previewHtml = ref('');
const updatePreview = () => {
    if (props.type === 'note' && localValue.value) {
        previewHtml.value = renderWikitextToHtml(localValue.value);
    } else {
        previewHtml.value = '';
    }
};

// Watch localValue for live preview updates
watch(localValue, () => {
    if (props.type === 'note' && visible.value) {
        updatePreview();
    }
});

// Update preview when dialog opens
watch(visible, (newVal) => {
    if (newVal && props.type === 'note') {
        updatePreview();
    }
});

// WYSIWYG Editor Logic for Notes
const textareaRef = ref<any>(null);

// Insert wikitext formatting at cursor position
const insertFormatting = (before: string, after: string = '', placeholder: string = 'text') => {
    const textarea = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localValue.value;
    const selectedText = text.substring(start, end) || placeholder;
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    localValue.value = newText;
    
    // Restore focus and set cursor position
    setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
};

const insertBold = () => insertFormatting("'''", "'''");
const insertItalic = () => insertFormatting("''", "''");
const insertWikilink = () => insertFormatting('[[', ']]', 'link');
const insertBulletList = () => {
    const textarea = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const text = localValue.value;
    const beforeCursor = text.substring(0, start);
    const afterCursor = text.substring(start);
    
    // Check if we're at the start of a line
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const currentLineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const isStartOfLine = start === currentLineStart || beforeCursor.substring(currentLineStart).trim() === '';
    
    if (isStartOfLine) {
        localValue.value = beforeCursor + '* ' + afterCursor;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 2, start + 2);
        }, 10);
    } else {
        localValue.value = beforeCursor + '\n* ' + afterCursor;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 3, start + 3);
        }, 10);
    }
};

const insertNumberedList = () => {
    const textarea = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const text = localValue.value;
    const beforeCursor = text.substring(0, start);
    const afterCursor = text.substring(start);
    
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const currentLineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const isStartOfLine = start === currentLineStart || beforeCursor.substring(currentLineStart).trim() === '';
    
    if (isStartOfLine) {
        localValue.value = beforeCursor + '# ' + afterCursor;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 2, start + 2);
        }, 10);
    } else {
        localValue.value = beforeCursor + '\n# ' + afterCursor;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 3, start + 3);
        }, 10);
    }
};

const insertCodeBlock = () => insertFormatting('<code>', '</code>', 'code');

// Reference Dialog Management for Notes
const showRefDialog = ref(false);
const currentRefType = ref<'Refcheck' | 'Refurl' | 'cn'>('Refcheck');
const tempRefParams = ref<Record<string, string>>({});

const openRefDialog = (type: 'Refcheck' | 'Refurl' | 'cn') => {
    currentRefType.value = type;
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'Refcheck') {
        tempRefParams.value = { user: 'User', date: today, comment: '' };
    } else if (type === 'Refurl') {
        tempRefParams.value = { url: '', title: '', date: today, snippet: '' };
    } else if (type === 'cn') {
        tempRefParams.value = { date: today, reason: '' };
    }
    
    showRefDialog.value = true;
};

const insertReference = () => {
    const params = Object.entries(tempRefParams.value)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join('|');
    
    const template = `{{${currentRefType.value}${params ? '|' + params : ''}}}`;
    
    const textarea = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!textarea) {
        localValue.value += ' ' + template;
    } else {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = localValue.value;
        localValue.value = text.substring(0, start) + template + text.substring(end);
        
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + template.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 10);
    }
    
    showRefDialog.value = false;
};
</script>

<template>
  <div>
    <Button 
      :icon="icon" 
      :severity="hasContent ? 'primary' : 'secondary'" 
      :variant="hasContent ? 'filled' : 'outlined'"
      rounded 
      text
      size="small"
      v-tooltip.top="tooltipText"
      @click="openDialog"
    />

    <Dialog v-model:visible="visible" :header="title || (type === 'ref' ? 'References' : 'Edit Notes')" modal :class="type === 'note' ? 'w-full max-w-6xl' : 'w-full max-w-2xl'">
      <div class="flex flex-col gap-4">
        
        <!-- Reference Editor -->
        <div v-if="type === 'ref'">
            <div class="flex gap-2 mb-4">
                <Button label="Refcheck" icon="pi pi-check" size="small" severity="secondary" variant="outlined" @click="addReference('Refcheck')" />
                <Button label="Refurl" icon="pi pi-link" size="small" severity="secondary" variant="outlined" @click="addReference('Refurl')" />
                <Button label="Citation" icon="pi pi-question" size="small" severity="secondary" variant="outlined" @click="addReference('cn')" />
            </div>

            <div v-if="references.length === 0" class="text-surface-500 italic text-center py-4 border border-dashed rounded border-surface-300 dark:border-surface-700">
                No references added.
            </div>

            <div v-else class="max-h-[60vh] overflow-y-auto pr-2 rounded">
                <TransitionGroup name="list" tag="div" class="flex flex-col gap-3">
                    <div v-for="(ref, index) in references" :key="ref.id" class="p-3 border rounded border-surface-200 dark:border-surface-700 relative bg-surface-50 dark:bg-surface-900 shadow-sm">
                        
                         <!-- Header with type and close button -->
                        <div class="flex justify-between items-center mb-2 border-b pb-2 border-surface-200 dark:border-surface-700">
                            <div class="font-bold flex items-center gap-2">
                                <i v-if="ref.type === 'Refcheck'" class="pi pi-check-circle text-primary-600"></i>
                                <i v-if="ref.type === 'Refurl'" class="pi pi-link text-primary-600"></i>
                                <i v-if="ref.type === 'cn'" class="pi pi-question-circle text-orange-500"></i>
                                <i v-if="ref.type === 'text'" class="pi pi-align-left text-surface-500"></i>
                                <span :class="{'text-primary-600': ref.type !== 'cn' && ref.type !== 'text', 'text-orange-500': ref.type === 'cn', 'text-surface-700': ref.type === 'text'}">
                                    {{ ref.type === 'cn' ? 'Citation Needed' : (ref.type === 'text' ? 'Text Content' : ref.type) }}
                                </span>
                            </div>
                            <Button icon="pi pi-times" text rounded severity="danger" size="small" @click="removeReference(index)" />
                        </div>

                        <!-- Refcheck Form -->
                        <div v-if="ref.type === 'Refcheck'" class="flex flex-col gap-2">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <InputGroup>
                                    <InputGroupAddon>User</InputGroupAddon>
                                    <AutoComplete v-model="ref.params.user" :suggestions="userSuggestions" @complete="searchUser" placeholder="Username" class="w-full flex-1" />
                                </InputGroup>
                                 <InputGroup>
                                    <InputGroupAddon>Date</InputGroupAddon>
                                    <InputText v-model="ref.params.date" placeholder="YYYY-MM-DD" />
                                </InputGroup>
                            </div>
                            <InputGroup>
                                    <InputGroupAddon>Comment</InputGroupAddon>
                                    <InputText v-model="ref.params.comment" placeholder="Optional comment" />
                            </InputGroup>
                        </div>

                         <!-- Refurl Form -->
                        <div v-if="ref.type === 'Refurl'" class="flex flex-col gap-2">
                             <InputGroup>
                                    <InputGroupAddon>URL</InputGroupAddon>
                                    <InputText v-model="ref.params.url" placeholder="https://..." />
                            </InputGroup>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                 <InputGroup>
                                    <InputGroupAddon>Title</InputGroupAddon>
                                    <InputText v-model="ref.params.title" placeholder="Page Title" />
                                </InputGroup>
                                 <InputGroup>
                                    <InputGroupAddon>Date</InputGroupAddon>
                                    <InputText v-model="ref.params.date" placeholder="YYYY-MM-DD" />
                                </InputGroup>
                            </div>
                             <InputGroup>
                                    <InputGroupAddon>Snippets</InputGroupAddon>
                                    <InputText v-model="ref.params.snippet" placeholder="Optional quote" />
                            </InputGroup>
                        </div>

                        <!-- Citation Needed Form -->
                        <div v-if="ref.type === 'cn'" class="flex flex-col gap-2">
                             <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                 <InputGroup>
                                    <InputGroupAddon>Date</InputGroupAddon>
                                    <InputText v-model="ref.params.date" placeholder="YYYY-MM-DD" />
                                </InputGroup>
                                 <InputGroup>
                                    <InputGroupAddon>Reason</InputGroupAddon>
                                    <InputText v-model="ref.params.reason" placeholder="Optional reason" />
                                </InputGroup>
                            </div>
                        </div>

                        <!-- Text Fallback -->
                        <div v-if="ref.type === 'text'" class="flex flex-col gap-2">
                            <Textarea v-model="ref.content" rows="2" autoResize />
                        </div>

                    </div>
                </TransitionGroup>
            </div>
        </div>

        <!-- Note Editor with WYSIWYG Toolbar and Preview -->
        <div v-else class="flex flex-col gap-3">
            <Toolbar class="!p-2 !border !rounded">
                <template #start>
                    <div class="flex gap-1 flex-wrap">
                        <Button 
                            label="B"
                            text 
                            size="small" 
                            severity="secondary"
                            v-tooltip.top="'Bold (wikitext)'"
                            @click="insertBold"
                            class="!font-bold !min-w-[2rem]"
                        />
                        <Button 
                            label="I"
                            text 
                            size="small" 
                            severity="secondary"
                            v-tooltip.top="'Italic (wikitext)'"
                            @click="insertItalic"
                            class="!italic !min-w-[2rem]"
                        />
                        <Button 
                            icon="pi pi-link" 
                            text 
                            size="small" 
                            severity="secondary"
                            v-tooltip.top="'Wikilink'"
                            @click="insertWikilink"
                        />
                        <div class="h-6 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                        <Button 
                            icon="pi pi-list" 
                            text 
                            size="small" 
                            severity="secondary"
                            v-tooltip.top="'Bullet list'"
                            @click="insertBulletList"
                        />
                        <Button 
                            label="1."
                            text 
                            size="small" 
                            severity="secondary"
                            v-tooltip.top="'Numbered list'"
                            @click="insertNumberedList"
                            class="!min-w-[2rem]"
                        />
                        <Button 
                            icon="pi pi-code" 
                            text 
                            size="small" 
                            severity="secondary"
                            v-tooltip.top="'Code block'"
                            @click="insertCodeBlock"
                        />
                        <div class="h-6 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                        <Button 
                            icon="pi pi-check" 
                            label="Refcheck"
                            text 
                            size="small" 
                            severity="secondary"
                            @click="openRefDialog('Refcheck')"
                        />
                        <Button 
                            icon="pi pi-external-link" 
                            label="Refurl"
                            text 
                            size="small" 
                            severity="secondary"
                            @click="openRefDialog('Refurl')"
                        />
                        <Button 
                            icon="pi pi-question" 
                            label="Citation"
                            text 
                            size="small" 
                            severity="secondary"
                            @click="openRefDialog('cn')"
                        />
                    </div>
                </template>
            </Toolbar>
            
            <!-- Dual Panel: Textarea + Preview -->
            <div class="grid grid-cols-2 gap-3">
                <!-- Wikitext Editor -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Wikitext Source</label>
                    <Textarea 
                        ref="textareaRef" 
                        v-model="localValue" 
                        rows="8" 
                        class="w-full !font-mono !text-sm" 
                        placeholder="Enter wikitext here..." 
                        autoResize 
                    />
                </div>
                
                <!-- Live Preview -->
                <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Preview</label>
                    <div 
                        class="border border-surface-300 dark:border-surface-600 rounded p-3 min-h-[200px] bg-surface-50 dark:bg-surface-900 overflow-auto"
                        v-html="previewHtml || '<span class=\'text-surface-400 italic text-sm\'>Preview will appear here...</span>'"
                    ></div>
                </div>
            </div>
        </div>
        
        <div class="flex justify-end gap-2">
          <Button label="Cancel" text @click="visible = false" />
          <Button label="Save" @click="save" />
        </div>
      </div>
    </Dialog>

    <!-- Reference Parameter Dialog for Notes -->
    <Dialog v-model:visible="showRefDialog" :header="'Insert ' + (currentRefType === 'cn' ? 'Citation Needed' : currentRefType)" modal class="w-full max-w-md">
      <div class="flex flex-col gap-3">
        <!-- Refcheck Form -->
        <div v-if="currentRefType === 'Refcheck'" class="flex flex-col gap-2">
          <InputGroup>
            <InputGroupAddon>User</InputGroupAddon>
            <AutoComplete v-model="tempRefParams.user" :suggestions="userSuggestions" @complete="searchUser" placeholder="Username" class="w-full flex-1" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>Date</InputGroupAddon>
            <InputText v-model="tempRefParams.date" placeholder="YYYY-MM-DD" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>Comment</InputGroupAddon>
            <InputText v-model="tempRefParams.comment" placeholder="Optional comment" />
          </InputGroup>
        </div>

        <!-- Refurl Form -->
        <div v-if="currentRefType === 'Refurl'" class="flex flex-col gap-2">
          <InputGroup>
            <InputGroupAddon>URL</InputGroupAddon>
            <InputText v-model="tempRefParams.url" placeholder="https://..." />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>Title</InputGroupAddon>
            <InputText v-model="tempRefParams.title" placeholder="Page Title" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>Date</InputGroupAddon>
            <InputText v-model="tempRefParams.date" placeholder="YYYY-MM-DD" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>Snippet</InputGroupAddon>
            <InputText v-model="tempRefParams.snippet" placeholder="Optional quote" />
          </InputGroup>
        </div>

        <!-- Citation Needed Form -->
        <div v-if="currentRefType === 'cn'" class="flex flex-col gap-2">
          <InputGroup>
            <InputGroupAddon>Date</InputGroupAddon>
            <InputText v-model="tempRefParams.date" placeholder="YYYY-MM-DD" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>Reason</InputGroupAddon>
            <InputText v-model="tempRefParams.reason" placeholder="Optional reason" />
          </InputGroup>
        </div>

        <div class="flex justify-end gap-2">
          <Button label="Cancel" text @click="showRefDialog = false" />
          <Button label="Insert" @click="insertReference" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>
