import { ref, watch } from 'vue';

export interface ReleaseDate {
    platform: string;
    date: string;
    ref?: string;
}

export interface StructuredReleaseDate {
    platform: string;
    date: Date | null;
    rawDate?: string; // For things like TBA, EA, etc.
    ref?: string;
}

export function useInfoboxDates(
    initialDates: ReleaseDate[],
    onUpdate: (dates: ReleaseDate[]) => void
) {
    const structuredDates = ref<StructuredReleaseDate[]>([]);

    // Watch for external changes (props) to parse them into local state
    watch(() => initialDates, (val) => {
        if (!val || val.length === 0) {
            if (structuredDates.value.length > 0) structuredDates.value = [];
            return;
        }

        // Check if we really need to update to avoid loops
        const currentModelDates = JSON.stringify(val);
        const currentLocalMapped = structuredDates.value
            .filter(d => d.platform && (d.date || d.rawDate))
            .map(d => {
                let dateStr = d.rawDate || '';
                if (d.date && !d.rawDate) {
                    dateStr = d.date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    });
                }
                return { platform: d.platform, date: dateStr, ref: d.ref || '' };
            });

        if (JSON.stringify(currentLocalMapped) === currentModelDates) {
            return;
        }

        const newStructured = val.map(rd => {
            const d = new Date(rd.date);
            return {
                platform: rd.platform,
                date: isNaN(d.getTime()) ? null : d,
                rawDate: rd.date,
                ref: rd.ref || ''
            };
        });

        structuredDates.value = newStructured;
    }, { immediate: true, deep: true });

    // Sync local changes back to the model
    watch(structuredDates, (newDates) => {
        const newModelDates = newDates
            .filter(d => d.platform && (d.date || d.rawDate))
            .map(d => {
                let dateStr = d.rawDate || '';
                if (d.date && !d.rawDate) {
                    dateStr = d.date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    });
                }
                return {
                    platform: d.platform,
                    date: dateStr,
                    ref: d.ref
                };
            });

        // Only emit if changed
        if (JSON.stringify(newModelDates) !== JSON.stringify(initialDates)) {
            onUpdate(newModelDates);
        }
    }, { deep: true });

    const addReleaseDate = () => {
        structuredDates.value.push({ platform: 'Windows', date: null, rawDate: '', ref: '' });
    };

    const removeReleaseDate = (index: number) => {
        structuredDates.value.splice(index, 1);
    };

    return {
        structuredDates,
        addReleaseDate,
        removeReleaseDate
    };
}
