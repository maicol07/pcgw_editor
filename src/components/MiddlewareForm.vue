<script setup lang="ts">
import { GameMiddleware } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import { 
  Zap, Volume2, Layout, Gamepad2, Film, Users, Shield
} from 'lucide-vue-next';

defineProps<{
  middleware: GameMiddleware;
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <Panel header="Middleware" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Zap" label="Physics" v-model:value="middleware.physics" v-model:notes="middleware.physicsNotes" free-text />
        <RatingRow :icon="Volume2" label="Audio" v-model:value="middleware.audio" v-model:notes="middleware.audioNotes" free-text />
        <RatingRow :icon="Layout" label="Interface" v-model:value="middleware.interface" v-model:notes="middleware.interfaceNotes" free-text />
        <RatingRow :icon="Gamepad2" label="Input" v-model:value="middleware.input" v-model:notes="middleware.inputNotes" free-text />
        <RatingRow :icon="Film" label="Cutscenes" v-model:value="middleware.cutscenes" v-model:notes="middleware.cutscenesNotes" free-text />
        <RatingRow :icon="Users" label="Multiplayer" v-model:value="middleware.multiplayer" v-model:notes="middleware.multiplayerNotes" free-text />
        <RatingRow :icon="Shield" label="Anticheat" v-model:value="middleware.anticheat" v-model:notes="middleware.anticheatNotes" free-text />
      </div>
    </Panel>
  </div>
</template>
