<template>
  <!-- optional: notes -->
  <div class="col-12">
    <SidePanelNotesView :tabset="props.tabset" />
  </div>

  <!-- folders -->
  <div class="col-12">
    <SidePanelFoldersView
      :key="props.tabset.id + '_' + props.tabset.folderActive + '_' + tabsetsLastUpdate"
      :tabset="props.tabset"
      :filter="filter || ''"
      @folders-found="(n: number) => emits('folders-found', n)" />
  </div>

  <SidePanelPageTabList
    :key="tabsetsLastUpdate + '_' + filter"
    :filter="filter || ''"
    :tabsCount="props.tabset.tabs.length"
    :tabset="tabsetForTabList(props.tabset as Tabset)"
    @tabs-found="(n: number) => emits('tabs-found', n)" />

  <!--  <div v-for="tab in props.tabset.tabs">-->
  <!--    <div class="ellipsis" @click="useNavigationService().browserTabFor(tab.url!)">{{ tab.title }}</div>-->
  <!--  </div>-->
</template>

<script setup lang="ts">
import SidePanelNotesView from 'src/notes/views/sidepanel/SidePanelNotesView.vue'
import SidePanelPageTabList from 'src/tabsets/layouts/SidePanelPageTabList.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import SidePanelFoldersView from 'src/tabsets/views/sidepanel/SidePanelFoldersView.vue'
import { ref, watchEffect } from 'vue'

type Props = {
  tabset: Tabset
  filter?: string
}

const props = defineProps<Props>()
const emits = defineEmits(['tabs-found', 'folders-found'])

const tabsetsLastUpdate = ref(0)

watchEffect(() => {
  tabsetsLastUpdate.value = useTabsetsStore().lastUpdate
})

const tabsetForTabList = (tabset: Tabset) => {
  if (tabset.folderActive) {
    const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    if (af) {
      return af
    }
  }
  return tabset
}
</script>
