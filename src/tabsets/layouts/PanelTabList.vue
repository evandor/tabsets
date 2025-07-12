<template>
  <q-list separator class="q-ma-none">
    <!-- supporting drag & drop when not on mobile -->
    <vue-draggable-next
      v-if="!props.preventDragAndDrop"
      class="q-ma-none"
      :list="props.tabs as Array<Tab>"
      :group="{ name: 'tabs', pull: 'clone' }"
      @change="handleDragAndDrop">
      <SidePanelTabListHelper
        v-for="(tab, index) in props.tabs"
        :tab="tab"
        :index="index"
        :type="props.type"
        :sorting="props.sorting"
        :preventDragAndDrop="false"
        :tabsetType="props.tabsetType"
        :tabset="props.tabset!"
        :show-tabsets="props.showTabsets">
        <template v-slot:actionPart>
          <span>&nbsp;</span>
        </template>
      </SidePanelTabListHelper>
    </vue-draggable-next>

    <!-- no drag & drop on mobile -->
    <SidePanelTabListHelper
      v-else
      v-for="(tab, index) in props.tabs"
      :tab="tab"
      :index="index"
      :type="props.type"
      :sorting="props.sorting"
      :preventDragAndDrop="true"
      :tabsetType="props.tabsetType"
      :tabset="props.tabset!"
      :show-tabsets="props.showTabsets" />
  </q-list>

  <audio id="myAudio">
    <source src="mp3/click.mp3" type="audio/mp3" />
  </audio>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { CreateTabFromOpenTabsCommand } from 'src/tabsets/commands/CreateTabFromOpenTabs'
import SidePanelTabListHelper from 'src/tabsets/layouts/SidePanelTabListHelper.vue'
import { Tab, TabSorting } from 'src/tabsets/models/Tab'
import { Tabset, TabsetSharing, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { PropType } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'

const props = defineProps({
  tabs: { type: Array as PropType<Tab[]>, required: true },
  hideMenu: { type: Boolean, default: false },
  sorting: { type: String as PropType<TabSorting>, default: TabSorting.CUSTOM },
  type: { type: String, default: 'sidepanel' },
  showTabsets: { type: Boolean, default: false },
  preventDragAndDrop: { type: Boolean, default: false },
  tabsetType: { type: String, default: TabsetType.DEFAULT.toString() },
  tabset: { type: Object as PropType<Tabset>, required: false },
})

async function moveTo2(tabId: string, newIndex: number, useActiveFolder: string | undefined = undefined) {
  console.log(`moving tabId ${tabId} to new index ${newIndex}`)
  const currentTabset = useTabsetsStore().getCurrentTabset!
  const activeFolder = useTabsetsStore().getActiveFolder(currentTabset, useActiveFolder)
  console.log('activeFolder', activeFolder?.name, activeFolder?.id)
  let tabs = activeFolder ? activeFolder.tabs : currentTabset.tabs
  // console.log(
  //   'tabs before',
  //   _.map(tabs, (t: any) => t.url),
  // )
  //tabs = _.filter(tabs, (t: Tab) => t.columnId === column.id)
  const oldIndex = _.findIndex(tabs, (t: any) => t.id === tabId)
  if (oldIndex >= 0) {
    // console.log('found old index', oldIndex)
    const tab = tabs.splice(oldIndex, 1)[0]
    tabs.splice(newIndex, 0, tab!)

    // Sharing
    if (currentTabset.sharing.sharedId && currentTabset.sharing.sharing === TabsetSharing.PUBLIC_LINK) {
      currentTabset.sharing.sharing = TabsetSharing.PUBLIC_LINK_OUTDATED
    }

    await useTabsetService().saveCurrentTabset()
  }
}

const handleDragAndDrop = (event: any) => {
  console.log('event', event)
  const { moved, added } = event
  if (moved) {
    console.log('d&d tabs moved', moved.element.id, moved.newIndex)
    let useIndex = moved.newIndex
    moveTo2(moved.element.id, useIndex)
  }
  if (added) {
    useCommandExecutor().executeFromUi(new CreateTabFromOpenTabsCommand(added.element, added.newIndex))
  }
}
</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
