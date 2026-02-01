<script setup lang="ts">
import { SettingsVideo, SettingsInput, SettingsAudio, SettingsNetwork, SettingsVR, SettingsAPI, GameMiddleware } from '../models/GameData';
import RatingSelect from './RatingSelect.vue';
import VideoForm from './VideoForm.vue';
import InputForm from './InputForm.vue';
import AudioForm from './AudioForm.vue';
import NetworkForm from './NetworkForm.vue';
import VRSupportForm from './VRSupportForm.vue';
import APIForm from './APIForm.vue';
import MiddlewareForm from './MiddlewareForm.vue';
import InputText from 'primevue/inputtext';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

defineProps<{
  video: SettingsVideo;
  input: SettingsInput;
  audio: SettingsAudio;
  network: SettingsNetwork;
  vr: SettingsVR;
  api: SettingsAPI;
  middleware: GameMiddleware;
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <Accordion multiple>
        <AccordionPanel value="0">
            <AccordionHeader>Video Settings</AccordionHeader>
            <AccordionContent>
                <VideoForm :video="video" />
            </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="1">
            <AccordionHeader>Input Settings</AccordionHeader>
            <AccordionContent>
                <InputForm :input="input" />
            </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="2">
            <AccordionHeader>Audio Settings</AccordionHeader>
            <AccordionContent>
                <AudioForm :audio="audio" />
            </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="3">
            <AccordionHeader>Network Settings</AccordionHeader>
            <AccordionContent>
                <NetworkForm :network="network" />
            </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="4">
            <AccordionHeader>VR Support</AccordionHeader>
            <AccordionContent>
                <VRSupportForm :vr="vr" />
            </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="5">
            <AccordionHeader>API & Middleware</AccordionHeader>
            <AccordionContent>
                 <div class="flex flex-col gap-6">
                    <APIForm :api="api" />
                    <MiddlewareForm :middleware="middleware" />
                 </div>
            </AccordionContent>
        </AccordionPanel>
    </Accordion>
  </div>
</template>

