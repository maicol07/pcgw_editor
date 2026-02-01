<template>
  <div class="system-requirements-form">
    <Message severity="info" class="mb-4">
      System requirements should be populated for <b>all</b> supported operating systems.
    </Message>

    <div class="card">
      <Tabs value="Windows">
        <TabList>
            <Tab value="Windows">
                <div class="flex items-center gap-2">
                    <img :src="iconWindows" alt="Windows" class="w-5 h-5" />
                    <span>Windows</span>
                </div>
            </Tab>
            <Tab value="Mac">
                <div class="flex items-center gap-2">
                    <img :src="iconMac" alt="Mac" class="w-5 h-5" />
                    <span>Mac</span>
                </div>
            </Tab>
            <Tab value="Linux">
                <div class="flex items-center gap-2">
                    <img :src="iconLinux" alt="Linux" class="w-5 h-5" />
                    <span>Linux</span>
                </div>
            </Tab>
        </TabList>
        <TabPanels>
            <TabPanel value="Windows">
                <OSRequirementsForm v-model="requirements.windows" os="Windows" />
            </TabPanel>
            <TabPanel value="Mac">
                <OSRequirementsForm v-model="requirements.mac" os="Mac" />
            </TabPanel>
            <TabPanel value="Linux">
                <OSRequirementsForm v-model="requirements.linux" os="Linux" />
            </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SystemRequirements } from '../models/GameData';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import OSRequirementsForm from './OSRequirementsForm.vue';

// Icons
import iconWindows from '../assets/icons/os-windows.svg';
import iconMac from '../assets/icons/os-osx.svg';
import iconLinux from '../assets/icons/os-linux.svg';

const requirements = defineModel<SystemRequirements>({ required: true });

</script>

