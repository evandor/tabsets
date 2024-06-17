<template>
  <q-btn
      icon="close"
      @click="useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)"
      flat
      class="q-ma-none q-pa-xs cursor-pointer"
      style="max-width:20px"
      size="10px">
    <q-tooltip class="tooltip">Close this view</q-tooltip>
  </q-btn>

</template>
<script setup lang="ts">
import {useUiStore} from "src/ui/stores/uiStore";
import {SidePanelViews} from "src/models/SidePanelViews";
</script>
