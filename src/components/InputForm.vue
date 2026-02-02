<script setup lang="ts">
import { SettingsInput } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import NotesButton from './NotesButton.vue';
import { 
  Keyboard, Move, MousePointerClick, ArrowUpDown, Tablet, 
  Gamepad2, CheckCircle, Settings, SlidersHorizontal, Plug, 
  Smartphone, Users, Box, Zap, Search, Monitor, Hand
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

    <Panel header="General Controller" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="Controller Support" v-model:value="input.controllerSupport" v-model:notes="input.controllerSupportNotes" v-model:reference="input.controllerSupportRef" />
        <RatingRow :icon="CheckCircle" label="Full Controller Support" v-model:value="input.fullController" v-model:notes="input.fullControllerNotes" v-model:reference="input.fullControllerRef" />
        <RatingRow :icon="Settings" label="Controller Remapping" v-model:value="input.controllerRemap" v-model:notes="input.controllerRemapNotes" v-model:reference="input.controllerRemapRef" />
        <RatingRow :icon="SlidersHorizontal" label="Controller Sensitivity" v-model:value="input.controllerSensitivity" v-model:notes="input.controllerSensitivityNotes" v-model:reference="input.controllerSensitivityRef" />
        <RatingRow :icon="ArrowUpDown" label="Invert Controller Y-Axis" v-model:value="input.invertControllerY" v-model:notes="input.invertControllerYNotes" v-model:reference="input.invertControllerYRef" />
        <RatingRow :icon="Plug" label="Controller Hotplugging" v-model:value="input.controllerHotplug" v-model:notes="input.controllerHotplugNotes" v-model:reference="input.controllerHotplugRef" />
        <RatingRow :icon="Smartphone" label="Haptic Feedback" v-model:value="input.hapticFeedback" v-model:notes="input.hapticFeedbackNotes" v-model:reference="input.hapticFeedbackRef" />
         <!-- New: HD Haptics -->
        <RatingRow :icon="Smartphone" label="Haptic Feedback HD" v-model:value="input.hapticFeedbackHd" v-model:notes="input.hapticFeedbackHdNotes" v-model:reference="input.hapticFeedbackHdRef" />
        <div class="mb-2">
          <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Smartphone" class="w-4 h-4" />
               <span class="truncate">HD Haptics Models</span>
            </InputGroupAddon>
            <InputText v-model="input.hapticFeedbackHdControllerModels" class="!rounded-none !border-l-0 !border-r-0" placeholder="Comma separated models..." />
          </InputGroup>
        </div>

        <RatingRow :icon="Users" label="Simultaneous Input" v-model:value="input.simultaneousInput" v-model:notes="input.simultaneousInputNotes" v-model:reference="input.simultaneousInputRef" />
        <RatingRow :icon="Zap" label="Acceleration Option" v-model:value="input.accelerationOption" v-model:notes="input.accelerationOptionNotes" v-model:reference="input.accelerationOptionRef" />
      </div>
    </Panel>

    <Panel header="XInput / DirectInput" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="XInput Controllers" v-model:value="input.xinputControllers" v-model:notes="input.xinputControllersNotes" v-model:reference="input.xinputControllersRef" />
        <RatingRow :icon="Box" label="Xbox Prompts" v-model:value="input.xboxPrompts" v-model:notes="input.xboxPromptsNotes" v-model:reference="input.xboxPromptsRef" />
        <RatingRow :icon="Zap" label="Impulse Triggers" v-model:value="input.impulseTriggers" v-model:notes="input.impulseTriggersNotes" v-model:reference="input.impulseTriggersRef" />
        <RatingRow :icon="Gamepad2" label="DirectInput Controllers" v-model:value="input.directInputControllers" v-model:notes="input.directInputControllersNotes" v-model:reference="input.directInputControllersRef" />
        <RatingRow :icon="Box" label="DirectInput Prompts" v-model:value="input.directInputPrompts" v-model:notes="input.directInputPromptsNotes" v-model:reference="input.directInputPromptsRef" />
      </div>
    </Panel>

    <Panel header="PlayStation" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="PlayStation Controllers" v-model:value="input.playstationControllers" v-model:notes="input.playstationControllersNotes" v-model:reference="input.playstationControllersRef" />
        
        <div class="mb-2">
          <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Gamepad2" class="w-4 h-4" />
               <span class="truncate">Controller Models</span>
            </InputGroupAddon>
            <InputText v-model="input.playstationControllerModels" class="!rounded-none !border-l-0 !border-r-0" placeholder="Comma separated..." />
          </InputGroup>
        </div>

        <RatingRow :icon="Box" label="PlayStation Prompts" v-model:value="input.playstationPrompts" v-model:notes="input.playstationPromptsNotes" v-model:reference="input.playstationPromptsRef" />
        <RatingRow :icon="Move" label="Motion Sensors" v-model:value="input.playstationMotionSensors" v-model:notes="input.playstationMotionSensorsNotes" v-model:reference="input.playstationMotionSensorsRef" />
        
        <div class="mb-2">
           <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Move" class="w-4 h-4" />
               <span class="truncate">Motion Sensor Modes</span>
            </InputGroupAddon>
            <InputText v-model="input.playstationMotionSensorsModes" class="!rounded-none !border-l-0 !border-r-0" />
           </InputGroup>
        </div>

        <RatingRow :icon="Zap" label="Light Bar Support" v-model:value="input.glightBar" v-model:notes="input.glightBarNotes" v-model:reference="input.glightBarRef" />
        <RatingRow :icon="Zap" label="Adaptive Triggers" v-model:value="input.dualSenseAdaptiveTrigger" v-model:notes="input.dualSenseAdaptiveTriggerNotes" v-model:reference="input.dualSenseAdaptiveTriggerRef" />
        <RatingRow :icon="Smartphone" label="DualSense Haptics" v-model:value="input.dualSenseHaptics" v-model:notes="input.dualSenseHapticsNotes" v-model:reference="input.dualSenseHapticsRef" />
        
        <div class="mb-2">
           <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Plug" class="w-4 h-4" />
               <span class="truncate">Connection Modes</span>
            </InputGroupAddon>
            <InputText v-model="input.playstationConnectionModes" class="!rounded-none !border-l-0 !border-r-0" placeholder="usb, bluetooth" />
            <InputGroupAddon class="p-0 min-w-[3rem]">
                <NotesButton v-model="input.playstationConnectionModesNotes" type="note" class="w-full h-full !rounded-none !border-none" />
            </InputGroupAddon>
           </InputGroup>
        </div>
      </div>
    </Panel>

    <Panel header="Nintendo" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Gamepad2" label="Nintendo Controllers" v-model:value="input.nintendoControllers" v-model:notes="input.nintendoControllersNotes" v-model:reference="input.nintendoControllersRef" />
        
        <div class="mb-2">
          <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Gamepad2" class="w-4 h-4" />
               <span class="truncate">Controller Models</span>
            </InputGroupAddon>
            <InputText v-model="input.nintendoControllerModels" class="!rounded-none !border-l-0 !border-r-0" placeholder="Comma separated..." />
          </InputGroup>
        </div>

        <RatingRow :icon="Box" label="Nintendo Prompts" v-model:value="input.nintendoPrompts" v-model:notes="input.nintendoPromptsNotes" v-model:reference="input.nintendoPromptsRef" />
        <RatingRow :icon="Settings" label="Button Layout" v-model:value="input.nintendoButtonLayout" v-model:notes="input.nintendoButtonLayoutNotes" v-model:reference="input.nintendoButtonLayoutRef" />
        <RatingRow :icon="Move" label="Motion Sensors" v-model:value="input.nintendoMotionSensors" v-model:notes="input.nintendoMotionSensorsNotes" v-model:reference="input.nintendoMotionSensorsRef" />
        
        <div class="mb-2">
           <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Move" class="w-4 h-4" />
               <span class="truncate">Motion Sensor Modes</span>
            </InputGroupAddon>
            <InputText v-model="input.nintendoMotionSensorsModes" class="!rounded-none !border-l-0 !border-r-0" />
           </InputGroup>
        </div>

        <div class="mb-2">
           <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Plug" class="w-4 h-4" />
               <span class="truncate">Connection Modes</span>
            </InputGroupAddon>
            <InputText v-model="input.nintendoConnectionModes" class="!rounded-none !border-l-0 !border-r-0" placeholder="bluetooth" />
            <InputGroupAddon class="p-0 min-w-[3rem]">
                <NotesButton v-model="input.nintendoConnectionModesNotes" type="note" class="w-full h-full !rounded-none !border-none" />
            </InputGroupAddon>
           </InputGroup>
        </div>
      </div>
    </Panel>

    <Panel header="Steam Input" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Box" label="Steam Input API" v-model:value="input.steamInputApi" v-model:notes="input.steamInputApiNotes" v-model:reference="input.steamInputApiRef" />
        <RatingRow :icon="Box" label="Steam Hook Input" v-model:value="input.steamHookInput" v-model:notes="input.steamHookInputNotes" v-model:reference="input.steamHookInputRef" />
        <RatingRow :icon="Box" label="Steam Input Prompts" v-model:value="input.steamInputPrompts" v-model:notes="input.steamInputPromptsNotes" v-model:reference="input.steamInputPromptsRef" />
        
        <div class="mb-2">
           <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Box" class="w-4 h-4" />
               <span class="truncate">Prompts Icons</span>
            </InputGroupAddon>
            <InputText v-model="input.steamInputPromptsIcons" class="!rounded-none !border-l-0 !border-r-0" placeholder="xbox, playstation..." />
           </InputGroup>
        </div>

        <div class="mb-2">
           <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Box" class="w-4 h-4" />
               <span class="truncate">Prompts Styles</span>
            </InputGroupAddon>
            <InputText v-model="input.steamInputPromptsStyles" class="!rounded-none !border-l-0 !border-r-0" placeholder="in-game, siapi" />
           </InputGroup>
        </div>

        <RatingRow :icon="Tablet" label="Steam Deck Prompts" v-model:value="input.steamDeckPrompts" v-model:notes="input.steamDeckPromptsNotes" v-model:reference="input.steamDeckPromptsRef" />
        <RatingRow :icon="Gamepad2" label="Steam Controller Prompts" v-model:value="input.steamControllerPrompts" v-model:notes="input.steamControllerPromptsNotes" v-model:reference="input.steamControllerPromptsRef" />
        <RatingRow :icon="Move" label="SIAPI Motion Sensors" v-model:value="input.steamInputMotionSensors" v-model:notes="input.steamInputMotionSensorsNotes" v-model:reference="input.steamInputMotionSensorsRef" />
        <RatingRow :icon="Settings" label="Steam Input Presets" v-model:value="input.steamInputPresets" v-model:notes="input.steamInputPresetsNotes" v-model:reference="input.steamInputPresetsRef" />
        <RatingRow :icon="Search" label="Cursor Detection" v-model:value="input.steamCursorDetection" v-model:notes="input.steamCursorDetectionNotes" v-model:reference="input.steamCursorDetectionRef" />
      </div>
    </Panel>

    <Panel header="Other / Misc" toggleable collapsed>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Hand" label="Tracked Motion" v-model:value="input.trackedMotionControllers" v-model:notes="input.trackedMotionControllersNotes" v-model:reference="input.trackedMotionControllersRef" />
        <RatingRow :icon="Box" label="Tracked Motion Prompts" v-model:value="input.trackedMotionPrompts" v-model:notes="input.trackedMotionPromptsNotes" v-model:reference="input.trackedMotionPromptsRef" />
        <RatingRow :icon="Gamepad2" label="Other Controllers" v-model:value="input.otherControllers" v-model:notes="input.otherControllersNotes" v-model:reference="input.otherControllersRef" />
        <RatingRow :icon="Box" label="Other Button Prompts" v-model:value="input.otherButtonPrompts" v-model:notes="input.otherButtonPromptsNotes" v-model:reference="input.otherButtonPromptsRef" />
        <RatingRow :icon="Monitor" label="Digital Movement" v-model:value="input.digitalMovementSupported" v-model:notes="input.digitalMovementSupportedNotes" v-model:reference="input.digitalMovementSupportedRef" />
        
        <RatingRow :icon="Settings" label="Peripheral Devices" v-model:value="input.peripheralDevices" v-model:notes="input.peripheralDevicesNotes" v-model:reference="input.peripheralDevicesRef" />
        <div class="mb-2">
           <InputGroup class="h-8">
            <InputGroupAddon class="!justify-start font-medium text-sm bg-surface-50 dark:bg-surface-800 w-48 gap-2 text-surface-600 dark:text-surface-400">
               <component :is="Settings" class="w-4 h-4" />
               <span class="truncate">Peripheral Types</span>
            </InputGroupAddon>
            <InputText v-model="input.peripheralDeviceTypes" class="!rounded-none !border-l-0 !border-r-0" />
           </InputGroup>
        </div>

        <RatingRow :icon="Zap" label="Input Prompt Override" v-model:value="input.inputPromptOverride" v-model:notes="input.inputPromptOverrideNotes" v-model:reference="input.inputPromptOverrideRef" />
      </div>
    </Panel>
  </div>
</template>
