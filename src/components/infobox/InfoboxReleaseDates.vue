<script setup lang="ts">
import { inject, ref } from 'vue';
import { useInfoboxDates, ReleaseDate } from '../../composables/useInfoboxDates';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { Calendar, Trash2, Plus } from 'lucide-vue-next';

// Platform options
const platformOptions = [
  'Windows', 'macOS', 'Linux', 'Android', 'iOS',
  'Nintendo Switch', 'PlayStation 4', 'PlayStation 5',
  'Xbox One', 'Xbox Series X|S'
];

const model = defineModel<ReleaseDate[]>({ default: () => [] });

// Use the extracted logic
const { structuredDates, addReleaseDate, removeReleaseDate } = useInfoboxDates(model.value, (newDates) => {
  model.value = newDates;
});

// Search highlight check
const searchQuery = inject('searchQuery', ref(''));
const isMatch = (text: string) => false;
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="flex flex-col gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50/50 dark:bg-surface-800/50">
      <div v-for="(rd, index) in structuredDates" :key="index"
        class="p-3 border border-surface-200 dark:border-surface-700 rounded bg-surface-50/50 dark:bg-surface-800/50 flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3">
          <Select v-model="rd.platform" :options="platformOptions" placeholder="Platform" class="w-32" size="small" />

          <div class="flex-1 relative">
            <InputText v-model="rd.rawDate" placeholder="Select date or type custom (e.g. TBA)" class="w-full pr-10"
              size="small" @update:model-value="rd.date = null" />
            <div class="absolute right-1 top-1/2 -translate-y-1/2">
              <Button severity="secondary" text rounded size="small"
                class="relative overflow-hidden w-8 h-8 !p-0 flex items-center justify-center">
                <Calendar class="w-4 h-4 text-surface-500" />
                <DatePicker v-model="rd.date" class="opacity-0 !absolute inset-0 w-full h-full p-0 !cursor-pointer"
                  @update:model-value="(d) => { if (d instanceof Date) rd.rawDate = format(d, 'MMMM d, yyyy', { locale: enUS }) }" />
              </Button>
            </div>
          </div>

          <Button severity="danger" variant="outlined" @click="removeReleaseDate(index)" size="small"
            class="!w-8 !h-8 !p-0">
            <template #icon>
              <Trash2 class="w-4 h-4" />
            </template>
          </Button>
        </div>
        <div class="flex flex-col gap-1.5 pt-1 border-t border-surface-100 dark:border-surface-700/50">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] uppercase font-bold text-surface-400 whitespace-nowrap">Special:</span>
            <div class="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              <Button v-for="s in ['TBA', 'EA', 'Unknown', 'LC', 'Cancelled']" :key="s" :label="s"
                class="text-[9px] !px-2 !py-0.5" :variant="rd.rawDate === s ? 'filled' : 'outlined'"
                severity="secondary" @click="rd.rawDate = s; rd.date = null" />
            </div>
          </div>
        </div>
      </div>
      <Button label="Add Release Date" severity="secondary" size="small" @click="addReleaseDate" class="w-full">
        <template #icon>
          <Plus class="w-4 h-4" />
        </template>
      </Button>
    </div>
  </div>
</template>
