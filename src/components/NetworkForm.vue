<script setup lang="ts">
import { SettingsNetwork } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select'; // Assuming this is used for ratings manually if needed, or just use RatingRow for base.

defineProps<{
  network: SettingsNetwork;
}>();

const ratingOptions = ['true', 'false', 'unknown', 'hackable', 'limited', 'always on', 'n/a'];
</script>

<template>
  <div class="flex flex-col gap-6">
    <Panel header="Multiplayer Types" toggleable>
      <div class="flex flex-col gap-4">
         <!-- Local Play -->
         <div class="p-2 border rounded border-surface-200 dark:border-surface-700">
             <div class="font-bold mb-2">Local Play</div>
             <div class="flex flex-col gap-2">
                 <RatingRow label="Supported" v-model:value="network.localPlay" v-model:notes="network.localPlayNotes" v-model:reference="network.localPlayRef" />
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-[200px]">
                     <InputText v-model="network.localPlayPlayers" placeholder="Players" />
                     <InputText v-model="network.localPlayModes" placeholder="Modes" />
                 </div>
             </div>
         </div>

         <!-- LAN Play -->
         <div class="p-2 border rounded border-surface-200 dark:border-surface-700">
             <div class="font-bold mb-2">LAN Play</div>
             <div class="flex flex-col gap-2">
                 <RatingRow label="Supported" v-model:value="network.lanPlay" v-model:notes="network.lanPlayNotes" v-model:reference="network.lanPlayRef" />
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-[200px]">
                     <InputText v-model="network.lanPlayPlayers" placeholder="Players" />
                     <InputText v-model="network.lanPlayModes" placeholder="Modes" />
                 </div>
             </div>
         </div>

         <!-- Online Play -->
         <div class="p-2 border rounded border-surface-200 dark:border-surface-700">
             <div class="font-bold mb-2">Online Play</div>
              <div class="flex flex-col gap-2">
                 <RatingRow label="Supported" v-model:value="network.onlinePlay" v-model:notes="network.onlinePlayNotes" v-model:reference="network.onlinePlayRef" />
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0 md:ml-[200px]">
                     <InputText v-model="network.onlinePlayPlayers" placeholder="Players" />
                     <InputText v-model="network.onlinePlayModes" placeholder="Modes" />
                 </div>
             </div>
         </div>

         <RatingRow label="Asynchronous" v-model:value="network.asynchronous" v-model:notes="network.asynchronousNotes" v-model:reference="network.asynchronousRef" />
         
         <div class="flex flex-col gap-2">
            <RatingRow label="Crossplay" v-model:value="network.crossplay" v-model:notes="network.crossplayNotes" v-model:reference="network.crossplayRef" />
            <div class="ml-0 md:ml-[200px]">
                <InputText v-model="network.crossplayPlatforms" placeholder="Platforms" class="w-full" />
            </div>
         </div>
      </div>
    </Panel>

    <Panel header="Connection Types" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow label="Matchmaking" v-model:value="network.matchmaking" v-model:notes="network.matchmakingNotes" v-model:reference="network.matchmakingRef" />
        <RatingRow label="Peer-to-peer" v-model:value="network.p2p" v-model:notes="network.p2pNotes" v-model:reference="network.p2pRef" />
        <RatingRow label="Dedicated" v-model:value="network.dedicated" v-model:notes="network.dedicatedNotes" v-model:reference="network.dedicatedRef" />
        <RatingRow label="Self-hosting" v-model:value="network.selfHosting" v-model:notes="network.selfHostingNotes" v-model:reference="network.selfHostingRef" />
        <RatingRow label="Direct IP" v-model:value="network.directIp" v-model:notes="network.directIpNotes" v-model:reference="network.directIpRef" />
      </div>
    </Panel>

    <Panel header="Ports" toggleable collapsed>
      <div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
          <label class="font-medium">TCP Ports</label>
          <InputText v-model="network.tcpPorts" placeholder="e.g. 80, 443" />
          
          <label class="font-medium">UDP Ports</label>
          <InputText v-model="network.udpPorts" placeholder="e.g. 80, 443" />
          
          <label class="font-medium">UPnP</label>
          <Select :options="ratingOptions" v-model="network.upnp" placeholder="Select..." />
      </div>
    </Panel>
  </div>
</template>
