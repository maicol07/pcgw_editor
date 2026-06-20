<script setup lang="ts">
import { SettingsVR } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import BulkRatingActions from './common/BulkRatingActions.vue';
import Panel from 'primevue/panel';
import type { RatingValue } from '../utils/ratings';

const props = defineProps<{
  vr: SettingsVR;
}>();

const setAll = (keys: (keyof SettingsVR)[], value: RatingValue) => {
  for (const key of keys) (props.vr[key] as RatingValue) = value;
};

const modesKeys: (keyof SettingsVR)[] = ['native3d', 'nvidia3dVision', 'vorpx', 'vrOnly'];
const headsetKeys: (keyof SettingsVR)[] = ['openXr', 'steamVr', 'oculusVr', 'windowsMixedReality', 'osvr', 'forteNsx1'];
const inputKeys: (keyof SettingsVR)[] = ['keyboardMouse', 'handTracking', 'bodyTracking', 'faceTracking', 'eyeTracking', 'tobiiEyeTracking', 'trackIr', 'thirdSpaceGamingVest', 'novintFalcon'];
const playAreaKeys: (keyof SettingsVR)[] = ['playAreaSeated', 'playAreaStanding', 'playAreaRoomScale'];
</script>

<template>
  <div class="flex flex-col gap-6">
    <Panel toggleable>
      <template #header>
        <span class="font-bold">3D Modes</span>
        <span class="ml-2 text-xs text-surface-400 dark:text-surface-500">Keys: T/F/L/U</span>
      </template>
      <template #icons>
        <BulkRatingActions @set="setAll(modesKeys, $event)" />
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <RatingRow label="Native 3D" v-model:value="vr.native3d" v-model:notes="vr.native3dNotes" v-model:reference="vr.native3dRef" />
        <RatingRow label="Nvidia 3D Vision" v-model:value="vr.nvidia3dVision" v-model:notes="vr.nvidia3dVisionNotes" v-model:reference="vr.nvidia3dVisionRef" />
        <RatingRow label="vorpX" v-model:value="vr.vorpx" v-model:notes="vr.vorpxNotes" v-model:reference="vr.vorpxRef" />
        <RatingRow label="VR only" v-model:value="vr.vrOnly" />
      </div>
    </Panel>

    <Panel toggleable>
      <template #header>
        <span class="font-bold">Headsets</span>
      </template>
      <template #icons>
        <BulkRatingActions @set="setAll(headsetKeys, $event)" />
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <RatingRow label="OpenXR" v-model:value="vr.openXr" v-model:notes="vr.openXrNotes" v-model:reference="vr.openXrRef" />
        <RatingRow label="SteamVR" v-model:value="vr.steamVr" v-model:notes="vr.steamVrNotes" v-model:reference="vr.steamVrRef" />
        <RatingRow label="Oculus (Rift/Quest)" v-model:value="vr.oculusVr" v-model:notes="vr.oculusVrNotes" v-model:reference="vr.oculusVrRef" />
        <RatingRow label="Windows Mixed Reality" v-model:value="vr.windowsMixedReality" v-model:notes="vr.windowsMixedRealityNotes" v-model:reference="vr.windowsMixedRealityRef" />
        <RatingRow label="OSVR" v-model:value="vr.osvr" v-model:notes="vr.osvrNotes" v-model:reference="vr.osvrRef" />
        <RatingRow label="Forte VFX1/VFX3D" v-model:value="vr.forteNsx1" v-model:notes="vr.forteNsx1Notes" v-model:reference="vr.forteNsx1Ref" />
      </div>
    </Panel>

    <Panel toggleable>
      <template #header>
        <span class="font-bold">Input</span>
      </template>
      <template #icons>
        <BulkRatingActions @set="setAll(inputKeys, $event)" />
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <RatingRow label="Keyboard & Mouse" v-model:value="vr.keyboardMouse" v-model:notes="vr.keyboardMouseNotes" v-model:reference="vr.keyboardMouseRef" />
        <RatingRow label="Motion controllers" v-model:value="vr.handTracking" v-model:notes="vr.handTrackingNotes" v-model:reference="vr.handTrackingRef" />
        <RatingRow label="Body tracking" v-model:value="vr.bodyTracking" v-model:notes="vr.bodyTrackingNotes" v-model:reference="vr.bodyTrackingRef" />
        <RatingRow label="Face tracking" v-model:value="vr.faceTracking" v-model:notes="vr.faceTrackingNotes" v-model:reference="vr.faceTrackingRef" />
        <RatingRow label="Eye tracking" v-model:value="vr.eyeTracking" v-model:notes="vr.eyeTrackingNotes" v-model:reference="vr.eyeTrackingRef" />
        <RatingRow label="Tobii Eye Tracking" v-model:value="vr.tobiiEyeTracking" v-model:notes="vr.tobiiEyeTrackingNotes" v-model:reference="vr.tobiiEyeTrackingRef" />
        <RatingRow label="TrackIR" v-model:value="vr.trackIr" v-model:notes="vr.trackIrNotes" v-model:reference="vr.trackIrRef" />
        <RatingRow label="3rd Space Gaming Vest" v-model:value="vr.thirdSpaceGamingVest" v-model:notes="vr.thirdSpaceGamingVestNotes" v-model:reference="vr.thirdSpaceGamingVestRef" />
        <RatingRow label="Novint Falcon" v-model:value="vr.novintFalcon" v-model:notes="vr.novintFalconNotes" v-model:reference="vr.novintFalconRef" />
      </div>
    </Panel>

    <Panel toggleable>
      <template #header>
        <span class="font-bold">Play Area</span>
      </template>
      <template #icons>
        <BulkRatingActions @set="setAll(playAreaKeys, $event)" />
      </template>
      <div class="flex flex-col gap-2">
        <RatingRow label="Seated" v-model:value="vr.playAreaSeated" v-model:notes="vr.playAreaSeatedNotes" v-model:reference="vr.playAreaSeatedRef" />
        <RatingRow label="Standing" v-model:value="vr.playAreaStanding" v-model:notes="vr.playAreaStandingNotes" v-model:reference="vr.playAreaStandingRef" />
        <RatingRow label="Room-scale" v-model:value="vr.playAreaRoomScale" v-model:notes="vr.playAreaRoomScaleNotes" v-model:reference="vr.playAreaRoomScaleRef" />
      </div>
    </Panel>
  </div>
</template>
