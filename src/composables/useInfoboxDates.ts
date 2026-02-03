import { ref, watch } from 'vue';
import { format, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';

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
    let isInternalUpdate = false;

    // Helper to format date consistent with PCGW style (Month DD, YYYY)
    const formatDate = (date: Date): string => {
        return format(date, 'MMMM d, yyyy', { locale: enUS });
    };

    // Watch for external changes (props)
    watch(() => initialDates, (val) => {
        if (isInternalUpdate) {
            isInternalUpdate = false;
            return;
        }

        if (!val || val.length === 0) {
            if (structuredDates.value.length > 0) structuredDates.value = [];
            return;
        }

        // Parse external dates to internal structure
        const newStructured = val.map(rd => {
            const d = new Date(rd.date);
            return {
                platform: rd.platform,
                date: isValid(d) ? d : null,
                rawDate: rd.date,
                ref: rd.ref || ''
            };
        });

        // Simple length check + content check could stay, but to strictly follow modernization
        // and avoid cheap JSON.stringify if possible, we could use lodash.isEqual or just accept a re-render if it's not frequent.
        // For now, keeping the logic simple: direct assignment.
        // We rely on the internal update flag to prevent loops if we strictly sync.
        // But since we are mapping *new* objects, direct comparison fail.
        // We'll trust the prop update is authoritative.
        structuredDates.value = newStructured;
    }, { immediate: true, deep: true });

    // Sync local changes back to the model
    watch(structuredDates, (newDates) => {
        const newModelDates = newDates
            .filter(d => d.platform && (d.date || d.rawDate))
            .map(d => {
                let dateStr = d.rawDate || '';
                // If we have a valid date object and no raw "special" date overrides (like TBA), format it
                // Logic: If user picked a date, we format it. If they typed TBA, we use TBA.
                // The existing logic preferred rawDate.
                if (d.date && (!d.rawDate || isValid(new Date(d.rawDate)))) {
                    // If rawDate looks like a valid date, we overwrite it with our formatted one to ensure standard format
                    // Or if we just rely on d.date.
                    dateStr = formatDate(d.date);
                } else if (d.rawDate) {
                    dateStr = d.rawDate;
                }

                return {
                    platform: d.platform,
                    date: dateStr,
                    ref: d.ref
                };
            });

        // Check if actually changed to avoid infinite loop with the prop watcher
        if (JSON.stringify(newModelDates) !== JSON.stringify(initialDates)) {
            isInternalUpdate = true;
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
