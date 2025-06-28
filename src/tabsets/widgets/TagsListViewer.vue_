<template>
  <div class="q-ma-none" style="height:100%;max-width:100%">
    <q-scroll-area style="height: 100%">
<!--      <TagsListViewerWidget @tagSelected="(value) => selectTag(value)" />-->
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">

import {DrawerTabs, useUiStore} from "src/ui/stores/uiStore";
import TagsListViewerWidget from "src/tabsets/widgets/TagsListViewerWidget.vue";

const selectTag = (tag: string) => {
  console.log("selecting", tag)
  useUiStore().setSelectedTag(tag)
  //useUiStore().sidePanelSetActiveView(SidePanelViews.TAG)
  useUiStore().rightDrawerSetActiveTab(DrawerTabs.TAG_VIEWER)
}

</script>
