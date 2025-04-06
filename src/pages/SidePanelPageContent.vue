<template>
  <!-- optional: notes -->
  <div class="col-12">
    <SidePanelNotesView v-if="currentTabset" :tabset="currentTabset" />
  </div>
</template>

<script setup lang="ts">
import SidePanelNotesView from 'src/notes/views/sidepanel/SidePanelNotesView.vue'
</script>
