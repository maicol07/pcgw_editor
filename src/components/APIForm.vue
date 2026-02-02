<script setup lang="ts">
import { SettingsAPI } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import InputText from 'primevue/inputtext';
import Panel from 'primevue/panel';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import NotesButton from './NotesButton.vue';
import { 
  Monitor, Pencil, Globe, Zap, Send, AppWindow, Cpu, Box, 
  Terminal, Settings, Smartphone 
} from 'lucide-vue-next';

defineProps<{
  api: SettingsAPI;
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <Panel header="Graphics Support" toggleable>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Direct3D -->
        <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Direct3D Versions</label>
            <InputGroup>
                <InputGroupAddon><Monitor class="w-4 h-4" /></InputGroupAddon>
                <InputText v-model="api.dxVersion" placeholder="e.g. 9, 10, 11" class="w-full" />
                <InputGroupAddon class="p-0">
                     <NotesButton v-model="api.dxRef" type="ref" class="w-full h-full !rounded-none !border-none" />
                </InputGroupAddon>
            </InputGroup>
            <InputText v-model="api.dxNotes" placeholder="Notes..." class="w-full text-sm" />
        </div>
        
        <!-- DirectDraw -->
        <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">DirectDraw Versions</label>
            <InputGroup>
                <InputGroupAddon><Pencil class="w-4 h-4" /></InputGroupAddon>
                <InputText v-model="api.directDrawVersion" placeholder="e.g. 7" class="w-full" />
                <InputGroupAddon class="p-0">
                     <NotesButton v-model="api.directDrawRef" type="ref" class="w-full h-full !rounded-none !border-none" />
                </InputGroupAddon>
            </InputGroup>
            <InputText v-model="api.directDrawNotes" placeholder="Notes..." class="w-full text-sm" />
        </div>

        <!-- OpenGL -->
        <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">OpenGL Versions</label>
            <InputGroup>
                <InputGroupAddon><Globe class="w-4 h-4" /></InputGroupAddon>
                <InputText v-model="api.openGlVersion" placeholder="e.g. 4.6" class="w-full" />
                <InputGroupAddon class="p-0">
                     <NotesButton v-model="api.openGlRef" type="ref" class="w-full h-full !rounded-none !border-none" />
                </InputGroupAddon>
            </InputGroup>
            <InputText v-model="api.openGlNotes" placeholder="Notes..." class="w-full text-sm" />
        </div>

        <!-- Vulkan -->
        <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Vulkan Versions</label>
            <InputGroup>
                <InputGroupAddon><Zap class="w-4 h-4" /></InputGroupAddon>
                <InputText v-model="api.vulkanVersion" placeholder="e.g. 1.3" class="w-full" />
                <InputGroupAddon class="p-0">
                     <NotesButton v-model="api.vulkanRef" type="ref" class="w-full h-full !rounded-none !border-none" />
                </InputGroupAddon>
            </InputGroup>
            <InputText v-model="api.vulkanNotes" placeholder="Notes..." class="w-full text-sm" />
        </div>

        <!-- Glide -->
        <div class="flex flex-col gap-2">
             <label class="text-sm font-medium">Glide Versions</label>
             <InputGroup>
                <InputGroupAddon><Send class="w-4 h-4" /></InputGroupAddon>
                <InputText v-model="api.glideVersion" placeholder="e.g. 2, 3" class="w-full" />
                <InputGroupAddon class="p-0">
                     <NotesButton v-model="api.glideRef" type="ref" class="w-full h-full !rounded-none !border-none" />
                </InputGroupAddon>
             </InputGroup>
             <InputText v-model="api.glideNotes" placeholder="Notes..." class="w-full text-sm" />
        </div>

        <!-- WinG -->
        <!-- WinG -->
        <!-- WinG -->
        <!-- WinG -->
        <RatingRow :icon="AppWindow" label="WinG" v-model:value="api.wing" v-model:notes="api.wingNotes" v-model:reference="api.wingRef" compact />

        <!-- Software Mode -->
        <!-- Software Mode -->
        <RatingRow :icon="Cpu" label="Software Mode" v-model:value="api.softwareMode" v-model:notes="api.softwareModeNotes" v-model:reference="api.softwareModeRef" compact />

        <!-- Mantle -->
        <!-- Mantle -->
        <RatingRow :icon="Box" label="Mantle" v-model:value="api.mantle" v-model:notes="api.mantleNotes" v-model:reference="api.mantleRef" compact />
        
        <!-- Metal -->
        <!-- Metal -->
        <RatingRow :icon="AppWindow" label="Metal" v-model:value="api.metal" v-model:notes="api.metalNotes" v-model:reference="api.metalRef" compact />

        <!-- DOS Modes -->
        <div class="flex flex-col gap-2">
             <label class="text-sm font-medium">DOS Modes</label>
             <InputGroup>
                <InputGroupAddon><Terminal class="w-4 h-4" /></InputGroupAddon>
                <InputText v-model="api.dosModes" placeholder="e.g. VGA, SVGA" class="w-full" />
                <InputGroupAddon class="p-0">
                     <NotesButton v-model="api.dosModesRef" type="ref" class="w-full h-full !rounded-none !border-none" />
                </InputGroupAddon>
             </InputGroup>
             <InputText v-model="api.dosModesNotes" placeholder="Notes..." class="w-full text-sm" />
        </div>
      </div>
    </Panel>

     <Panel header="Operating System Support" toggleable collapsed>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
           <!-- Windows -->
           <div class="flex flex-col gap-3 p-3 border rounded border-surface-200 dark:border-surface-700">
               <div class="flex items-center justify-between border-b pb-1 mb-1">
                   <div class="font-bold flex items-center gap-2"><AppWindow class="w-4 h-4" /> Windows</div>
                   <div class="flex gap-1">
                       <NotesButton v-model="api.windowsRef" type="ref" />
                       <NotesButton v-model="api.windowsNotes" type="note" />
                   </div>
               </div>
               <div class="flex flex-col gap-2">
                   <RatingRow label="32-bit Executable" v-model:value="api.windows32" :icon="Settings" compact />
                   <RatingRow label="64-bit Executable" v-model:value="api.windows64" :icon="Settings" compact />
                   <RatingRow label="ARM App" v-model:value="api.windowsArm" :icon="Smartphone" compact />
               </div>
           </div>

           <!-- macOS -->
           <div class="flex flex-col gap-3 p-3 border rounded border-surface-200 dark:border-surface-700">
                <div class="flex items-center justify-between border-b pb-1 mb-1">
                    <div class="font-bold flex items-center gap-2"><AppWindow class="w-4 h-4" /> macOS / OS X</div>
                    <div class="flex gap-1">
                        <NotesButton v-model="api.macOsAppRef" type="ref" />
                        <NotesButton v-model="api.macOsAppNotes" type="note" />
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <RatingRow label="PowerPC App" v-model:value="api.macOsXPowerPc" :icon="Box" compact />
                    <RatingRow label="Intel 32-bit App" v-model:value="api.macOsIntel32" :icon="Box" compact />
                    <RatingRow label="Intel 64-bit App" v-model:value="api.macOsIntel64" :icon="Box" compact />
                    <RatingRow label="ARM App" v-model:value="api.macOsArm" :icon="Smartphone" compact />
                </div>
           </div>
           
           <!-- Classic Mac OS -->
           <div class="flex flex-col gap-3 p-3 border rounded border-surface-200 dark:border-surface-700">
                <div class="flex items-center justify-between border-b pb-1 mb-1">
                    <div class="font-bold flex items-center gap-2"><AppWindow class="w-4 h-4" /> Classic Mac OS</div>
                    <div class="flex gap-1">
                        <NotesButton v-model="api.macOsRef" type="ref" />
                        <NotesButton v-model="api.macOsNotes" type="note" />
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <RatingRow label="68k App" v-model:value="api.macOs68k" :icon="Box" compact />
                    <RatingRow label="PowerPC App" v-model:value="api.macOsPowerPc" :icon="Box" compact />
                </div>
           </div>

           <!-- Linux -->
           <div class="flex flex-col gap-3 p-3 border rounded border-surface-200 dark:border-surface-700">
                <div class="flex items-center justify-between border-b pb-1 mb-1">
                    <div class="font-bold flex items-center gap-2"><Terminal class="w-4 h-4" /> Linux</div>
                    <div class="flex gap-1">
                        <NotesButton v-model="api.linuxRef" type="ref" />
                        <NotesButton v-model="api.linuxNotes" type="note" />
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <RatingRow label="32-bit Executable" v-model:value="api.linux32" :icon="Settings" compact />
                    <RatingRow label="64-bit Executable" v-model:value="api.linux64" :icon="Settings" compact />
                    <RatingRow label="ARM App" v-model:value="api.linuxArm" :icon="Smartphone" compact />
                    <RatingRow label="PowerPC App" v-model:value="api.linuxPowerPc" :icon="Box" compact />
                </div>
           </div>
       </div>
    </Panel>
  </div>
</template>
