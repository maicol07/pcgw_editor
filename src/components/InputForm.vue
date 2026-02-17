<script setup lang="ts">
import { SettingsInput } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import {
  Keyboard, Move, MousePointerClick, ArrowUpDown, Tablet,
  Gamepad2, CheckCircle, Settings, SlidersHorizontal, Plug,
  Smartphone, Users, Box, Zap, Search, Monitor, Hand
} from 'lucide-vue-next';

import DynamicField from './schema/DynamicField.vue';
import { useFields } from '../composables/useFields';

defineProps<{
  input: SettingsInput;
}>();

const { getField } = useFields();
</script>

<template>
  <div class="flex flex-col gap-6">
    <Panel header="Mouse / Keyboard" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Keyboard" label="Key Remapping" v-model:value="input.keyRemap"
          v-model:notes="input.keyRemapNotes" v-model:reference="input.keyRemapRef" />
        <RatingRow :icon="Keyboard" label="Keyboard/Mouse Prompts" v-model:value="input.keyboardMousePrompts"
          v-model:notes="input.keyboardMousePromptsNotes" v-model:reference="input.keyboardMousePromptsRef" />
        <RatingRow :icon="Move" label="Mouse Sensitivity" v-model:value="input.mouseSensitivity"
          v-model:notes="input.mouseSensitivityNotes" v-model:reference="input.mouseSensitivityRef" />
        <RatingRow :icon="MousePointerClick" label="Mouse Menu" v-model:value="input.mouseMenu"
          v-model:notes="input.mouseMenuNotes" v-model:reference="input.mouseMenuRef" />
        <RatingRow :icon="ArrowUpDown" label="Invert Mouse Y-Axis" v-model:value="input.invertMouseY"
          v-model:notes="input.invertMouseYNotes" v-model:reference="input.invertMouseYRef" />
        <RatingRow :icon="Tablet" label="Touchscreen" v-model:value="input.touchscreen"
          v-model:notes="input.touchscreenNotes" v-model:reference="input.touchscreenRef" />
      </div>
    </Panel>

    <Panel header="General Controller" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="Controller Support" v-model:value="input.controllerSupport"
          v-model:notes="input.controllerSupportNotes" v-model:reference="input.controllerSupportRef" />
        <RatingRow :icon="CheckCircle" label="Full Controller Support" v-model:value="input.fullController"
          v-model:notes="input.fullControllerNotes" v-model:reference="input.fullControllerRef" />
        <RatingRow :icon="Settings" label="Controller Remapping" v-model:value="input.controllerRemap"
          v-model:notes="input.controllerRemapNotes" v-model:reference="input.controllerRemapRef" />
        <RatingRow :icon="SlidersHorizontal" label="Controller Sensitivity" v-model:value="input.controllerSensitivity"
          v-model:notes="input.controllerSensitivityNotes" v-model:reference="input.controllerSensitivityRef" />
        <RatingRow :icon="ArrowUpDown" label="Invert Controller Y-Axis" v-model:value="input.invertControllerY"
          v-model:notes="input.invertControllerYNotes" v-model:reference="input.invertControllerYRef" />
        <RatingRow :icon="Plug" label="Controller Hotplugging" v-model:value="input.controllerHotplug"
          v-model:notes="input.controllerHotplugNotes" v-model:reference="input.controllerHotplugRef" />
        <RatingRow :icon="Smartphone" label="Haptic Feedback" v-model:value="input.hapticFeedback"
          v-model:notes="input.hapticFeedbackNotes" v-model:reference="input.hapticFeedbackRef" />
        <RatingRow :icon="Smartphone" label="Haptic Feedback HD" v-model:value="input.hapticFeedbackHd"
          v-model:notes="input.hapticFeedbackHdNotes" v-model:reference="input.hapticFeedbackHdRef" />

        <DynamicField v-if="getField('input.hapticFeedbackHdControllerModels')"
          :field="getField('input.hapticFeedbackHdControllerModels')!"
          v-model="input.hapticFeedbackHdControllerModels" />

        <RatingRow :icon="Users" label="Simultaneous Input" v-model:value="input.simultaneousInput"
          v-model:notes="input.simultaneousInputNotes" v-model:reference="input.simultaneousInputRef" />
        <RatingRow :icon="Zap" label="Acceleration Option" v-model:value="input.accelerationOption"
          v-model:notes="input.accelerationOptionNotes" v-model:reference="input.accelerationOptionRef" />
      </div>
    </Panel>

    <Panel header="XInput / DirectInput" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="XInput Controllers" v-model:value="input.xinputControllers"
          v-model:notes="input.xinputControllersNotes" v-model:reference="input.xinputControllersRef" />
        <RatingRow :icon="Box" label="Xbox Prompts" v-model:value="input.xboxPrompts"
          v-model:notes="input.xboxPromptsNotes" v-model:reference="input.xboxPromptsRef" />
        <RatingRow :icon="Zap" label="Impulse Triggers" v-model:value="input.impulseTriggers"
          v-model:notes="input.impulseTriggersNotes" v-model:reference="input.impulseTriggersRef" />
        <RatingRow :icon="Gamepad2" label="DirectInput Controllers" v-model:value="input.directInputControllers"
          v-model:notes="input.directInputControllersNotes" v-model:reference="input.directInputControllersRef" />
        <RatingRow :icon="Box" label="DirectInput Prompts" v-model:value="input.directInputPrompts"
          v-model:notes="input.directInputPromptsNotes" v-model:reference="input.directInputPromptsRef" />
      </div>
    </Panel>

    <Panel header="PlayStation" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="PlayStation Controllers" v-model:value="input.playstationControllers"
          v-model:notes="input.playstationControllersNotes" v-model:reference="input.playstationControllersRef" />
        <DynamicField v-if="getField('input.playstationControllerModels')"
          :field="getField('input.playstationControllerModels')!" v-model="input.playstationControllerModels" />
        <RatingRow :icon="Box" label="PlayStation Prompts" v-model:value="input.playstationPrompts"
          v-model:notes="input.playstationPromptsNotes" v-model:reference="input.playstationPromptsRef" />
        <RatingRow :icon="Move" label="Motion Sensors" v-model:value="input.playstationMotionSensors"
          v-model:notes="input.playstationMotionSensorsNotes" v-model:reference="input.playstationMotionSensorsRef" />
        <DynamicField v-if="getField('input.playstationMotionSensorsModes')"
          :field="getField('input.playstationMotionSensorsModes')!" v-model="input.playstationMotionSensorsModes" />
        <RatingRow :icon="Zap" label="Light Bar Support" v-model:value="input.glightBar"
          v-model:notes="input.glightBarNotes" v-model:reference="input.glightBarRef" />
        <RatingRow :icon="Zap" label="Adaptive Triggers" v-model:value="input.dualSenseAdaptiveTrigger"
          v-model:notes="input.dualSenseAdaptiveTriggerNotes" v-model:reference="input.dualSenseAdaptiveTriggerRef" />
        <RatingRow :icon="Smartphone" label="DualSense Haptics" v-model:value="input.dualSenseHaptics"
          v-model:notes="input.dualSenseHapticsNotes" v-model:reference="input.dualSenseHapticsRef" />
        <DynamicField v-if="getField('input.playstationConnectionModes')"
          :field="getField('input.playstationConnectionModes')!" v-model="input.playstationConnectionModes" />
      </div>
    </Panel>

    <Panel header="Nintendo" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="Nintendo Controllers" v-model:value="input.nintendoControllers"
          v-model:notes="input.nintendoControllersNotes" v-model:reference="input.nintendoControllersRef" />
        <DynamicField v-if="getField('input.nintendoControllerModels')"
          :field="getField('input.nintendoControllerModels')!" v-model="input.nintendoControllerModels" />
        <RatingRow :icon="Box" label="Nintendo Prompts" v-model:value="input.nintendoPrompts"
          v-model:notes="input.nintendoPromptsNotes" v-model:reference="input.nintendoPromptsRef" />
        <RatingRow :icon="Settings" label="Button Layout" v-model:value="input.nintendoButtonLayout"
          v-model:notes="input.nintendoButtonLayoutNotes" v-model:reference="input.nintendoButtonLayoutRef" />
        <RatingRow :icon="Move" label="Motion Sensors" v-model:value="input.nintendoMotionSensors"
          v-model:notes="input.nintendoMotionSensorsNotes" v-model:reference="input.nintendoMotionSensorsRef" />
        <DynamicField v-if="getField('input.nintendoMotionSensorsModes')"
          :field="getField('input.nintendoMotionSensorsModes')!" v-model="input.nintendoMotionSensorsModes" />
        <DynamicField v-if="getField('input.nintendoConnectionModes')"
          :field="getField('input.nintendoConnectionModes')!" v-model="input.nintendoConnectionModes" />
      </div>
    </Panel>

    <Panel header="Steam Input" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Box" label="Steam Input API" v-model:value="input.steamInputApi"
          v-model:notes="input.steamInputApiNotes" v-model:reference="input.steamInputApiRef" />
        <RatingRow :icon="Box" label="Steam Hook Input" v-model:value="input.steamHookInput"
          v-model:notes="input.steamHookInputNotes" v-model:reference="input.steamHookInputRef" />
        <RatingRow :icon="Box" label="Steam Input Prompts" v-model:value="input.steamInputPrompts"
          v-model:notes="input.steamInputPromptsNotes" v-model:reference="input.steamInputPromptsRef" />
        <DynamicField v-if="getField('input.steamInputPromptsIcons')" :field="getField('input.steamInputPromptsIcons')!"
          v-model="input.steamInputPromptsIcons" />
        <DynamicField v-if="getField('input.steamInputPromptsStyles')"
          :field="getField('input.steamInputPromptsStyles')!" v-model="input.steamInputPromptsStyles" />
        <RatingRow :icon="Tablet" label="Steam Deck Prompts" v-model:value="input.steamDeckPrompts"
          v-model:notes="input.steamDeckPromptsNotes" v-model:reference="input.steamDeckPromptsRef" />
        <RatingRow :icon="Gamepad2" label="Steam Controller Prompts" v-model:value="input.steamControllerPrompts"
          v-model:notes="input.steamControllerPromptsNotes" v-model:reference="input.steamControllerPromptsRef" />
        <RatingRow :icon="Move" label="Motion Sensors" v-model:value="input.steamInputMotionSensors"
          v-model:notes="input.steamInputMotionSensorsNotes" />
        <DynamicField v-if="getField('input.steamInputMotionSensorsModes')"
          :field="getField('input.steamInputMotionSensorsModes')!" v-model="input.steamInputMotionSensorsModes" />
        <RatingRow :icon="Settings" label="Steam Input Presets" v-model:value="input.steamInputPresets"
          v-model:notes="input.steamInputPresetsNotes" v-model:reference="input.steamInputPresetsRef" />
        <RatingRow :icon="Search" label="Cursor Detection" v-model:value="input.steamCursorDetection"
          v-model:notes="input.steamCursorDetectionNotes" v-model:reference="input.steamCursorDetectionRef" />
      </div>
    </Panel>

    <Panel header="Other / Misc" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Hand" label="Tracked Motion" v-model:value="input.trackedMotionControllers"
          v-model:notes="input.trackedMotionControllersNotes" v-model:reference="input.trackedMotionControllersRef" />
        <RatingRow :icon="Box" label="Tracked Motion Prompts" v-model:value="input.trackedMotionPrompts"
          v-model:notes="input.trackedMotionPromptsNotes" v-model:reference="input.trackedMotionPromptsRef" />
        <RatingRow :icon="Gamepad2" label="Other Controllers" v-model:value="input.otherControllers"
          v-model:notes="input.otherControllersNotes" v-model:reference="input.otherControllersRef" />
        <RatingRow :icon="Box" label="Other Button Prompts" v-model:value="input.otherButtonPrompts"
          v-model:notes="input.otherButtonPromptsNotes" v-model:reference="input.otherButtonPromptsRef" freeText />
        <RatingRow :icon="Monitor" label="Digital Movement" v-model:value="input.digitalMovementSupported"
          v-model:notes="input.digitalMovementSupportedNotes" v-model:reference="input.digitalMovementSupportedRef" />
        <RatingRow :icon="Settings" label="Peripheral Devices" v-model:value="input.peripheralDevices"
          v-model:notes="input.peripheralDevicesNotes" v-model:reference="input.peripheralDevicesRef" />
        <DynamicField v-if="getField('input.peripheralDeviceTypes')" :field="getField('input.peripheralDeviceTypes')!"
          v-model="input.peripheralDeviceTypes" />
        <RatingRow :icon="Zap" label="Input Prompt Override" v-model:value="input.inputPromptOverride"
          v-model:notes="input.inputPromptOverrideNotes" v-model:reference="input.inputPromptOverrideRef" />
      </div>
    </Panel>
  </div>
</template>
