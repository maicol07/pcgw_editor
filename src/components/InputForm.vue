<script setup lang="ts">
import { SettingsInput } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import { 
  Keyboard, Move, MousePointerClick, ArrowUpDown, Tablet, 
  Gamepad2, CheckCircle, Settings, SlidersHorizontal, Plug, 
  Smartphone, Users, Box 
} from 'lucide-vue-next';

defineProps<{
  input: SettingsInput;
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <Panel header="Mouse / Keyboard" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Keyboard" label="Key Remapping" v-model:value="input.keyRemap" v-model:notes="input.keyRemapNotes" v-model:reference="input.keyRemapRef" />
        <RatingRow :icon="Keyboard" label="Keyboard/Mouse Prompts" v-model:value="input.keyboardMousePrompts" v-model:notes="input.keyboardMousePromptsNotes" v-model:reference="input.keyboardMousePromptsRef" />
        <RatingRow :icon="Move" label="Mouse Sensitivity" v-model:value="input.mouseSensitivity" v-model:notes="input.mouseSensitivityNotes" v-model:reference="input.mouseSensitivityRef" />
        <RatingRow :icon="MousePointerClick" label="Mouse Menu" v-model:value="input.mouseMenu" v-model:notes="input.mouseMenuNotes" v-model:reference="input.mouseMenuRef" />
        <RatingRow :icon="ArrowUpDown" label="Invert Mouse Y-Axis" v-model:value="input.invertMouseY" v-model:notes="input.invertMouseYNotes" v-model:reference="input.invertMouseYRef" />
        <RatingRow :icon="Tablet" label="Touchscreen" v-model:value="input.touchscreen" v-model:notes="input.touchscreenNotes" v-model:reference="input.touchscreenRef" />
      </div>
    </Panel>

    <Panel header="Controller" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="Controller Support" v-model:value="input.controllerSupport" v-model:notes="input.controllerSupportNotes" v-model:reference="input.controllerSupportRef" />
        <RatingRow :icon="CheckCircle" label="Full Controller Support" v-model:value="input.fullController" v-model:notes="input.fullControllerNotes" v-model:reference="input.fullControllerRef" />
        <RatingRow :icon="Settings" label="Controller Remapping" v-model:value="input.controllerRemap" v-model:notes="input.controllerRemapNotes" v-model:reference="input.controllerRemapRef" />
        <RatingRow :icon="SlidersHorizontal" label="Controller Sensitivity" v-model:value="input.controllerSensitivity" v-model:notes="input.controllerSensitivityNotes" v-model:reference="input.controllerSensitivityRef" />
        <RatingRow :icon="ArrowUpDown" label="Invert Controller Y-Axis" v-model:value="input.invertControllerY" v-model:notes="input.invertControllerYNotes" v-model:reference="input.invertControllerYRef" />
        <RatingRow :icon="Plug" label="Controller Hotplugging" v-model:value="input.controllerHotplug" v-model:notes="input.controllerHotplugNotes" v-model:reference="input.controllerHotplugRef" />
        <RatingRow :icon="Smartphone" label="Haptic Feedback" v-model:value="input.hapticFeedback" v-model:notes="input.hapticFeedbackNotes" v-model:reference="input.hapticFeedbackRef" />
        <RatingRow :icon="Users" label="Simultaneous Input" v-model:value="input.simultaneousInput" v-model:notes="input.simultaneousInputNotes" v-model:reference="input.simultaneousInputRef" />
        <RatingRow :icon="Box" label="Steam Input API" v-model:value="input.steamInputApi" v-model:notes="input.steamInputApiNotes" v-model:reference="input.steamInputApiRef" />
        <RatingRow :icon="Box" label="Steam Input Hooking" v-model:value="input.steamInput" v-model:notes="input.steamInputNotes" v-model:reference="input.steamInputRef" />
        <RatingRow :icon="Tablet" label="Steam Deck Prompts" v-model:value="input.steamDeckPrompts" v-model:notes="input.steamDeckPromptsNotes" v-model:reference="input.steamDeckPromptsRef" />
      </div>
    </Panel>
  </div>
</template>
