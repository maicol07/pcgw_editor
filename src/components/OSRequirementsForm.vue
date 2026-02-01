<template>
  <div class="os-requirements-form p-4">
    <h3 class="text-xl font-bold mb-4">{{ os }} System Requirements</h3>
    
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Minimum Specs -->
      <Panel header="Minimum" class="h-full">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                OS Version
                <HelpIcon text="Specific OS version required (e.g. Windows 10 64-bit)" />
            </label>
            <InputText v-model="model.minimum.os" placeholder="e.g. Windows 10" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                CPU
                <HelpIcon text="Processor model and speed (e.g. Intel Core i5)" />
            </label>
            <InputText v-model="model.minimum.cpu" placeholder="e.g. Intel Core i5-4460 or AMD Ryzen 3 1200" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                RAM
                <HelpIcon text="System memory required" />
            </label>
            <InputText v-model="model.minimum.ram" placeholder="e.g. 8 GB" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                HDD / SSD
                <HelpIcon text="Total storage space required" />
            </label>
            <InputText v-model="model.minimum.hdd" placeholder="e.g. 50 GB" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                GPU
                <HelpIcon text="Graphics card model and VRAM" />
            </label>
            <InputText v-model="model.minimum.gpu" placeholder="e.g. NVIDIA GeForce GTX 960 or AMD Radeon R9 280X" />
          </div>
        </div>
      </Panel>

      <!-- Recommended Specs -->
      <Panel header="Recommended" class="h-full">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                OS Version
                <HelpIcon text="Recommended OS for optimal performance" />
            </label>
            <InputText v-model="model.recommended.os" placeholder="e.g. Windows 10" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                CPU
                 <HelpIcon text="Recommended processor" />
            </label>
            <InputText v-model="model.recommended.cpu" placeholder="e.g. Intel Core i7-8700 or AMD Ryzen 5 3600" />
          </div>
          <div class="flex flex-col gap-2">
             <label class="font-bold flex items-center">
                RAM
                <HelpIcon text="Recommended system memory" />
            </label>
            <InputText v-model="model.recommended.ram" placeholder="e.g. 16 GB" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold flex items-center">
                HDD / SSD
                <HelpIcon text="Storage space" />
            </label>
            <InputText v-model="model.recommended.hdd" placeholder="e.g. 50 GB" />
          </div>
          <div class="flex flex-col gap-2">
             <label class="font-bold flex items-center">
                GPU
                <HelpIcon text="Recommended graphics card" />
            </label>
            <InputText v-model="model.recommended.gpu" placeholder="e.g. NVIDIA GeForce GTX 1070 or AMD Radeon RX 5700" />
          </div>
        </div>
      </Panel>
    </div>

    <div class="mt-4 flex flex-col gap-2">
      <label class="font-bold flex items-center">
        Notes
        <HelpIcon text="Any additional caveats or requirements (e.g. AVX support)" />
      </label>
      <Textarea v-model="model.notes" rows="3" placeholder="Additional notes about system requirements..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SystemRequirementsOS } from '../models/GameData';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Panel from 'primevue/panel';
import HelpIcon from './HelpIcon.vue';

const props = defineProps<{
  os: string;
}>();

const model = defineModel<SystemRequirementsOS>({ required: true });
</script>
