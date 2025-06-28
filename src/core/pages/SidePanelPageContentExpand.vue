<template>
  <!-- folders -->
  <div class="col-12">
    <SidePanelFoldersViewExpand
      v-if="props.tabset"
      :view-context="props.viewContext"
      :key="props.tabset.id + '_' + props.tabset.folderActive + '_' + tabsetsLastUpdate"
      :tabset="props.tabset"
      :filter="filter || ''"
      @folder-selected="expand()"
      @folders-found="(n: number) => emits('folders-found', n)" />
  </div>

  <SidePanelPageTabList
    :key="tabsetsLastUpdate + '_' + filter"
    :view-context="props.viewContext"
    :filter="filter || ''"
    :active-folder="props.tabset.id"
    :tabsCount="props.tabset.tabs.length"
    :tabset="tabsetForTabList(props.tabset as Tabset)"
    @tabs-found="(n: number) => emits('tabs-found', n)" />
</template>

<script setup lang="ts">
import { ViewContext } from 'src/core/models/ViewContext'
import SidePanelPageTabList from 'src/tabsets/layouts/SidePanelPageTabList.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import SidePanelFoldersViewExpand from 'src/tabsets/views/sidepanel/SidePanelFoldersViewExpand.vue'
import { ref, watchEffect } from 'vue'

type Props = {
  tabset: Tabset
  filter?: string
  viewContext?: ViewContext
}

const props = withDefaults(defineProps<Props>(), {
  viewContext: 'default',
})

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

const expand = () => {
  console.log('expanding')
}
</script>
