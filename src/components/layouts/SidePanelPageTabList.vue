<template>

  <q-list separator class="q-ma-none">

    <!-- supporting drag & drop when not on mobile -->
    <vue-draggable-next v-if="!props.preventDragAndDrop"
                        class="q-ma-none"
                        :list="tabs as Array<Tab>"
                        :group="{ name: 'tabs', pull: 'clone' }"
                        @change="handleDragAndDrop">

      <SidePanelTabListHelper v-for="tab in tabs"
                              :tab="tab"
                              :type="props.type"
                              :sorting="props.sorting"
                              :preventDragAndDrop="false"
                              :tabsetType="props.tabsetType"
                              :show-tabsets="props.showTabsets"
                              :hide-menu="props.hideMenu"/>
    </vue-draggable-next>

    <!-- no drag & drop on mobile -->
    <SidePanelTabListHelper v-else
                            v-for="tab in tabs"
                            :tab="tab"
                            :type="props.type"
                            :sorting="props.sorting"
                            :preventDragAndDrop="true"
                            :tabsetType="props.tabsetType"
                            :show-tabsets="props.showTabsets"
                            :hide-menu="props.hideMenu"/>
  </q-list>

  <audio id="myAudio">
    <source src="mp3/click.mp3" type="audio/mp3">
  </audio>

</template>

<script setup lang="ts">
import {Tab, TabSorting} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {ref, onMounted, PropType, watchEffect} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {Tabset, TabsetType} from "src/models/Tabset";
import SidePanelTabListHelper from "components/layouts/sidepanel/SidePanelTabListHelper.vue";
import {useTabsStore} from "stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";

const props = defineProps({
  tabsetId: {type: String, required: true},
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  type: {type: String, default: 'sidepanel'},
  showTabsets: {type: Boolean, default: false},
  preventDragAndDrop: {type: Boolean, default: false},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()},
})

const tabs = ref<Tab[]>([])

const handleDragAndDrop = (event: any) => {
  console.log("event", event)
  const {moved, added} = event
  if (moved) {
    console.log('d&d tabs moved', moved.element.id, moved.newIndex)
    let useIndex = moved.newIndex
    TabsetService.moveTo(moved.element.id, useIndex)
  }
  if (added) {
    useCommandExecutor()
        .executeFromUi(new CreateTabFromOpenTabsCommand(added.element, added.newIndex))
  }
}

watchEffect(() => {
  console.log(" === watch effect ===")
  const tabset = useTabsStore().getTabset(props.tabsetId)
  if (tabset) {
    tabs.value = useTabsetService().tabsToShow(tabset)
    console.log("tabs.value set to ", tabs.value)
  } else {
    console.warn("could not determine tabset for id", props.tabsetId)
    tabs.value = []
  }
})

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
