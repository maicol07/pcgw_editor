<script setup lang="ts">
import { SettingsAudio } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import BulkRatingActions from './common/BulkRatingActions.vue';
import Panel from 'primevue/panel';
import type { RatingValue } from '../utils/ratings';
import {
  SlidersHorizontal, Volume2, AlignCenter, Captions,
  VolumeX, CheckCircle
} from 'lucide-vue-next';

const props = defineProps<{
  audio: SettingsAudio;
}>();

const setAll = (keys: (keyof SettingsAudio)[], value: RatingValue) => {
  for (const key of keys) (props.audio[key] as RatingValue) = value;
};

const generalKeys: (keyof SettingsAudio)[] = ['separateVolume', 'surroundSound', 'subtitles', 'closedCaptions', 'muteOnFocusLost', 'royaltyFree'];
const apiKeys: (keyof SettingsAudio)[] = ['eaxSupport', 'redBookCdAudio', 'generalMidiAudio'];
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="bg-surface-0 dark:bg-surface-900 p-4 rounded-lg border border-surface-200 dark:border-surface-700">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span class="text-xs text-surface-400 dark:text-surface-500">Keys: T/F/L/U</span>
        <BulkRatingActions @set="setAll(generalKeys, $event)" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <RatingRow :icon="SlidersHorizontal" label="Separate Volume Controls" v-model:value="audio.separateVolume" v-model:notes="audio.separateVolumeNotes" v-model:reference="audio.separateVolumeRef" />
        <RatingRow :icon="Volume2" label="Surround Sound" v-model:value="audio.surroundSound" v-model:notes="audio.surroundSoundNotes" v-model:reference="audio.surroundSoundRef" />
        <RatingRow :icon="AlignCenter" label="Subtitles" v-model:value="audio.subtitles" v-model:notes="audio.subtitlesNotes" v-model:reference="audio.subtitlesRef" />
        <RatingRow :icon="Captions" label="Closed Captions" v-model:value="audio.closedCaptions" v-model:notes="audio.closedCaptionsNotes" v-model:reference="audio.closedCaptionsRef" />
        <RatingRow :icon="VolumeX" label="Mute on Focus Lost" v-model:value="audio.muteOnFocusLost" v-model:notes="audio.muteOnFocusLostNotes" v-model:reference="audio.muteOnFocusLostRef" />
        <RatingRow :icon="CheckCircle" label="Royalty Free Audio" v-model:value="audio.royaltyFree" v-model:notes="audio.royaltyFreeNotes" v-model:reference="audio.royaltyFreeRef" />
      </div>
    </div>

    <Panel toggleable collapsed>
      <template #header>
        <span class="font-bold">API</span>
      </template>
      <template #icons>
        <BulkRatingActions @set="setAll(apiKeys, $event)" />
      </template>
      <div class="flex flex-col gap-2">
        <RatingRow label="EAX Support" v-model:value="audio.eaxSupport" v-model:notes="audio.eaxSupportNotes" v-model:reference="audio.eaxSupportRef" />
        <RatingRow label="Red Book CD Audio" v-model:value="audio.redBookCdAudio" v-model:notes="audio.redBookCdAudioNotes" v-model:reference="audio.redBookCdAudioRef" />
        <RatingRow label="General MIDI Audio" v-model:value="audio.generalMidiAudio" v-model:notes="audio.generalMidiAudioNotes" v-model:reference="audio.generalMidiAudioRef" />
      </div>
    </Panel>
  </div>
</template>
