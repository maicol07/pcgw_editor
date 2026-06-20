<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ofetch } from 'ofetch';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { Sparkles, ExternalLink } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui';

const REPO = 'maicol07/pcgw_editor';
const ui = useUiStore();

const visible = computed({
    get: () => ui.releaseNotesOpen,
    set: (val) => { ui.releaseNotesOpen = val; },
});

const version = __APP_VERSION__;
const isStable = version !== 'main';
const title = isStable ? (version.startsWith('v') ? version : `v${version}`) : 'main';
// Stable -> release page; main -> commit compare (set once we know the latest tag).
const githubUrl = ref(isStable
    ? `https://github.com/${REPO}/releases/tag/${version}`
    : `https://github.com/${REPO}/commits/main`);

const loading = ref(false);
const error = ref('');
const html = ref('');          // rendered release-notes markdown (stable)
const commits = ref<string[]>([]); // commit subjects (main)
const loaded = ref(false);

async function load() {
    if (loaded.value) return;
    loading.value = true;
    error.value = '';
    try {
        if (isStable) {
            const rel = await ofetch<{ body: string }>(`https://api.github.com/repos/${REPO}/releases/tags/${version}`);
            // ponytail: GitHub /markdown render avoids adding a markdown dep; content is our own repo, low XSS risk.
            // Add `marked` only if we ever render untrusted markdown.
            html.value = rel.body
                ? await ofetch<string>('https://api.github.com/markdown', {
                    method: 'POST',
                    body: { text: rel.body, mode: 'gfm', context: REPO },
                })
                : '<p>No release notes.</p>';
        } else {
            // ponytail: git-cliff can't run in the browser; commit subjects from the compare API are the lazy equivalent.
            let messages: string[] = [];
            try {
                const latest = await ofetch<{ tag_name: string }>(`https://api.github.com/repos/${REPO}/releases/latest`);
                const cmp = await ofetch<{ commits: { commit: { message: string } }[] }>(
                    `https://api.github.com/repos/${REPO}/compare/${latest.tag_name}...${__COMMIT_HASH__}`
                );
                messages = cmp.commits.map((c) => c.commit.message);
                githubUrl.value = `https://github.com/${REPO}/compare/${latest.tag_name}...${__COMMIT_HASH__}`;
            } catch {
                const recent = await ofetch<{ commit: { message: string } }[]>(
                    `https://api.github.com/repos/${REPO}/commits?per_page=30`
                );
                messages = recent.map((c) => c.commit.message);
            }
            commits.value = messages.map((m) => m.split('\n')[0]).reverse();
        }
        loaded.value = true;
    } catch (e: unknown) {
        const status = (e as { status?: number })?.status;
        error.value = status === 403
            ? 'GitHub rate limit reached. Open the changes on GitHub instead.'
            : 'Could not load the latest changes.';
    } finally {
        loading.value = false;
    }
}

// Auto-open on a new build; load content the first time the dialog is shown.
onMounted(() => { if (ui.isNewBuild) ui.openReleaseNotes(); });
watch(visible, (open) => {
    if (open) load();
    else ui.markBuildSeen();
});
</script>

<template>
    <Dialog v-model:visible="visible"
        :style="{ width: '90vw', maxWidth: '720px' }" :breakpoints="{ '640px': '95vw' }" modal :draggable="false">
        <template #header>
            <div class="flex items-center gap-2 font-semibold">
                <Sparkles class="w-5 h-5 text-primary-500" />
                <span>What's new — {{ title }}</span>
            </div>
        </template>

        <div class="min-h-[120px]">
            <div v-if="loading" class="text-sm text-surface-500 py-8 text-center">Loading…</div>

            <div v-else-if="error" class="text-sm text-surface-500 py-8 text-center">
                {{ error }}
            </div>

            <!-- Stable: rendered GitHub release notes -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else-if="isStable" class="release-notes text-sm" v-html="html"></div>

            <!-- main: commit list since the latest release -->
            <ul v-else class="text-sm flex flex-col gap-1.5 list-disc pl-5">
                <li v-for="(msg, i) in commits" :key="i" class="text-surface-700 dark:text-surface-300">{{ msg }}</li>
                <li v-if="!commits.length" class="list-none text-surface-500">No new commits since the last release.</li>
            </ul>
        </div>

        <template #footer>
            <a :href="githubUrl" target="_blank" rel="noopener noreferrer" class="no-underline mr-auto">
                <Button label="View on GitHub" text size="small">
                    <template #icon><ExternalLink class="w-4 h-4 mr-1.5" /></template>
                </Button>
            </a>
            <Button label="Close" size="small" @click="visible = false" />
        </template>
    </Dialog>
</template>

<style scoped>
.release-notes :deep(h1),
.release-notes :deep(h2),
.release-notes :deep(h3) {
    font-weight: 700;
    margin: 1rem 0 0.5rem;
}
.release-notes :deep(ul) {
    list-style: disc;
    padding-left: 1.25rem;
}
.release-notes :deep(a) {
    color: var(--p-primary-500);
}
.release-notes :deep(code) {
    font-family: monospace;
    font-size: 0.85em;
}
</style>
