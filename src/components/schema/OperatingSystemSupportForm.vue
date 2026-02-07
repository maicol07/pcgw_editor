<script setup lang="ts">
import Select from 'primevue/select';
import NotesButton from '../NotesButton.vue';

// Icons for ratings
import iconTcTrue from '../../assets/icons/tc-true.svg';
import iconTcFalse from '../../assets/icons/tc-false.svg';
import iconTcUnknown from '../../assets/icons/tc-unknown.svg';
import iconTcHackable from '../../assets/icons/tc-hackable.svg';
import iconTcNa from '../../assets/icons/tc-not-applicable.svg';

// OS Icons
import iconOsWindows from '../../assets/icons/os-windows.svg';
import iconOsMac from '../../assets/icons/os-osx.svg';
import iconOsLinux from '../../assets/icons/os-linux.svg';

const iconTcLimited = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%231db288'/%3E%3Cpath fill='%23fff' d='m121,189c-4,5-7,8.5-14,8.5-14,0-61-51-63-57-2,-6 4,-10 8-12 9-5 17.5,1 23,7.5 25.5,33 34,13.5 51-11l41.5-61c5.5-7.5 13,-11.5 22.5-5 7.5,5.5 6,12 2,18.5z'/%3E%3Cpath style='fill:%23ffffff;stroke:%23f89842;stroke-width:8.22652245' d='m 116.89174,180.43528 8.9032,-27.4839 c 20.516,7.2261 35.4192,13.4841 44.7096,18.7742 -2.4517,-23.3545 -3.742,-39.419 -3.871,-48.1935 h 28.0645 c -0.3872,12.7745 -1.8711,28.7744 -4.4516,48 13.2902,-6.7095 28.516,-12.903 45.6773,-18.5807 l 8.9033,27.4839 c -16.3872,5.4195 -32.4517,9.0324 -48.1935,10.8387 7.8708,6.8389 18.9676,19.0324 33.2903,36.5806 l -23.2258,16.4515 c -7.484,-10.1933 -16.3227,-24.0642 -26.5161,-41.6128 -9.5484,18.1937 -17.9355,32.0647 -25.1613,41.6128 l -22.8386,-16.4515 c 14.9676,-18.4514 25.6773,-30.6449 32.129,-36.5806 -16.6452,-3.2256 -32.4516,-6.8385 -47.4193,-10.8387 z'/%3E%3C/svg%3E";
const iconTcAlwaysOn = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 250 250'%3E%3Ccircle cx='125' cy='125' r='121' fill='%23a0a11c'/%3E%3Crect ry='35.501' rx='35.501' height='106.501' width='71.001' y='62.874' x='89.499' fill='none' stroke='%23fff' stroke-width='17.75'/%3E%3Crect ry='8.875' rx='8.875' height='88.751' width='106.501' y='107.25' x='71.749' fill='%23fff'/%3E%3C/svg%3E";

const props = defineProps<{
    modelValue: any;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
}>();

const getIconSrc = (val: string) => {
    if (!val) return iconTcUnknown;
    const v = val.toLowerCase();
    if (v === 'true') return iconTcTrue;
    if (v === 'false') return iconTcFalse;
    if (v === 'limited') return iconTcLimited;
    if (v === 'always on') return iconTcAlwaysOn;
    if (v === 'hackable') return iconTcHackable;
    if (v === 'n/a') return iconTcNa;
    return iconTcUnknown;
};

const ratingOptions = ['true', 'false', 'n/a', 'hackable'];

// Helper to update API object
const updateField = (field: string, val: string) => {
    const newData = { ...props.modelValue };
    newData[field] = val;
    emit('update:modelValue', newData);
};

// --- Row Configuration ---
const rows = [
    {
        label: 'Windows',
        icon: iconOsWindows,
        fields: [
            { key: null, val: 'N/A', disabled: true }, // PPC
            // Removed extra N/A (16-bit) as it was N/A for 16-bit too, merged or just 32-bit starts next?
            // Actually, screenshot shows 2 N/A columns before 32-bit if we count spacer as one.
            // Wait, columns: PPC, 16-bit, 32-bit.
            // PPC -> Spacer (Empty).
            // 16-bit -> Need N/A.
            // 32-bit -> Need N/A? For Windows 32-bit is valid!
            // My code had: Spacer, N/A, N/A.
            // User screenshot showed 32-bit as N/A (gray).
            // If I delete one, I get: Spacer, N/A, windows32.
            // This aligns windows32 to 32-bit column. Correct.
            { key: null, val: 'N/A', disabled: true }, // 16-bit
            { key: 'windows32' },
            { key: 'windows64' },
            { key: 'windowsArm' },
        ],
        notesKey: 'windowsNotes'
    },
    {
        label: 'macOS (OS X)',
        icon: iconOsMac,
        fields: [
            { key: 'macOsXPowerPc' }, // PPC
            { key: null, val: 'N/A', disabled: true }, // 16-bit
            { key: 'macOsIntel32' }, // 32-bit
            { key: 'macOsIntel64' }, // 64-bit
            { key: 'macOsArm' }, // ARM
        ],
        notesKey: 'macOsAppNotes'
    },
    {
        label: 'Linux',
        icon: iconOsLinux,
        fields: [
            { key: 'linuxPowerPc' }, // PPC
            { key: null, val: 'N/A', disabled: true }, // 16-bit
            { key: 'linux32' }, // 32-bit
            { key: 'linux64' }, // 64-bit
            { key: 'linuxArm' }, // ARM
        ],
        notesKey: 'linuxNotes'
    },
    {
        label: 'Mac OS (Classic)',
        icon: iconOsMac, // Using Mac icon for Classic for now
        fields: [
            { key: 'macOsPowerPc' }, // PPC
            { key: 'macOs68k' }, // 16-bit/68k
            { key: null, val: 'N/A', disabled: true }, // 32-bit
            { key: null, val: 'N/A', disabled: true }, // 64-bit
            { key: null, val: 'N/A', disabled: true }, // ARM
        ],
        notesKey: 'macOsNotes'
    }
];

const columns = [
    { label: 'PPC', width: 'w-16' },
    { label: '16-bit', width: 'w-16' },
    { label: '32-bit', width: 'w-16' },
    { label: '64-bit', width: 'w-16' },
    { label: 'ARM', width: 'w-16' },
];

</script>

<template>
    <div class="w-full overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
        <table class="w-full text-sm text-left border-collapse bg-surface-0 dark:bg-surface-900">
            <thead class="text-xs uppercase bg-primary-600 text-white">
                <tr>
                    <th class="px-4 py-3 font-semibold rounded-tl-lg">Executable</th>
                    <th v-for="col in columns" :key="col.label" class="px-2 py-3 text-center font-semibold"
                        :class="col.width">
                        {{ col.label }}
                    </th>
                    <th class="px-4 py-3 font-semibold rounded-tr-lg">Notes</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-surface-200 dark:divide-surface-700">
                <tr v-for="row in rows" :key="row.label"
                    class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <!-- Executable Label with Icon -->
                    <td
                        class="px-4 py-3 font-medium text-surface-900 dark:text-surface-100 whitespace-nowrap bg-surface-50 dark:bg-surface-800/20">
                        <div class="flex items-center gap-2">
                            <img :src="row.icon" class="w-5 h-5" />
                            <span>{{ row.label }}</span>
                        </div>
                    </td>

                    <!-- Cells -->
                    <td v-for="(field, idx) in row.fields" :key="idx"
                        class="px-2 py-3 text-center border-l border-surface-100 dark:border-surface-800">
                        <div class="flex items-center justify-center h-8">
                            <div v-if="('type' in field) && field.type === 'spacer'" class="w-8 h-8"></div>
                            <div v-else-if="('disabled' in field) && field.disabled"
                                class="opacity-30 grayscale cursor-not-allowed" title="Not Applicable">
                                <img :src="iconTcNa" class="w-6 h-6" />
                            </div>
                            <Select v-else-if="'key' in field && field.key" :modelValue="modelValue?.[field.key] || ''"
                                @update:modelValue="updateField(field.key!, $event)" :options="ratingOptions"
                                class="border-none! ring-0! shadow-none! bg-transparent! p-0 flex justify-center h-full items-center w-auto min-w-0"
                                :pt="{
                                    root: { class: 'hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full p-1 transition-colors cursor-pointer flex items-center justify-center' },
                                    trigger: { class: 'hidden' },
                                    overlay: { class: 'min-w-[8rem]' }
                                }">
                                <template #value="slotProps">
                                    <div class="flex items-center justify-center w-8 h-8">
                                        <img :src="getIconSrc(slotProps.value)"
                                            class="w-6 h-6 hover:scale-110 transition-transform"
                                            :title="slotProps.value || 'Select...'" />
                                    </div>
                                </template>
                                <template #dropdownicon>
                                    <!-- Empty template to fully remove the icon if CSS fails -->
                                    <span class="hidden"></span>
                                </template>
                                <template #option="slotProps">
                                    <div class="flex items-center gap-2 px-2 py-1">
                                        <img :src="getIconSrc(slotProps.option)" class="w-5 h-5" />
                                        <span class="capitalize">{{ slotProps.option }}</span>
                                    </div>
                                </template>
                            </Select>
                        </div>
                    </td>

                    <!-- Notes -->
                    <td class="px-2 py-2 border-l border-surface-100 dark:border-surface-800 text-center">
                        <NotesButton :modelValue="modelValue?.[row.notesKey] || ''"
                            @update:modelValue="updateField(row.notesKey, $event)" type="note"
                            class="w-full h-full justify-center" />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
:deep(.p-select-dropdown) {
    display: none;
}
</style>
