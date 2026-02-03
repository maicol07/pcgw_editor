import { ref, readonly } from 'vue';

export interface PanelSearchState {
    query: string;
    visibility: Record<string, boolean>; // map of panelKey -> visible
    // We don't store the panel open/close state here because that belongs to the view
    // The view should subscribe to this and update its own state
}

export function useSearch(
    panelKeys: string[],
    keywordsMap: Record<string, string[]>,
    onMatch?: (key: string) => void
) {
    const searchQuery = ref('');
    const panelVisibility = ref<Record<string, boolean>>({});

    // Initialize all visible
    panelKeys.forEach(k => panelVisibility.value[k] = true);

    const performSearch = () => {
        const q = searchQuery.value.toLowerCase();

        if (!q || q.length < 2) {
            panelKeys.forEach(k => panelVisibility.value[k] = true);
            return;
        }

        panelKeys.forEach(key => {
            const matchKey = key.toLowerCase().includes(q);
            const matchKeywords = keywordsMap[key]?.some(k => k.includes(q)) ?? false;

            if (matchKey || matchKeywords) {
                panelVisibility.value[key] = true;
                if (onMatch) onMatch(key);
            } else {
                panelVisibility.value[key] = false;
            }
        });
    };

    const setSearchQuery = (q: string) => {
        searchQuery.value = q;
        performSearch();
    };

    return {
        searchQuery: readonly(searchQuery),
        panelVisibility: readonly(panelVisibility),
        setSearchQuery
    };
}
