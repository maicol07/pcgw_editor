<template>
  <div class="issues-form flex flex-col gap-6">
    <Message severity="info">
      Document any significant issues with the game. Separate unresolved issues from fixed ones.
    </Message>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Panel header="Unresolved Issues" class="h-full">
        <IssuesList v-model="issues.unresolved" type="unresolved" />
      </Panel>

      <Panel header="Fixed Issues" class="h-full">
        <IssuesList v-model="issues.fixed" type="fixed" />
      </Panel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GameIssues } from '../models/GameData';
import Panel from 'primevue/panel';
import Message from 'primevue/message';
import IssuesList from './IssuesList.vue';

const issues = defineModel<GameIssues>({ required: true });
</script>
