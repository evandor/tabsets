<template>

  <q-list separator class="q-ma-none">

    <!-- supporting drag & drop when not on mobile -->
    <vue-draggable-next v-if="!props.preventDragAndDrop"
                        class="q-ma-none"
                        :list="props.tabs as Array<Tab>"
                        :group="{ name: 'tabs', pull: 'clone' }"
                        @change="handleDragAndDrop">

      <SidePanelTabListHelper v-for="tab in props.tabs"
                              :tab="tab"
                              :type="props.type"
                              :sorting="props.sorting"
                              :preventDragAndDrop="false"
                              :tabsetType="props.tabsetType"
                              :hide-menu="props.hideMenu"/>
    </vue-draggable-next>

    <!-- no drag & drop on mobile -->
    <SidePanelTabListHelper v-else
                            v-for="tab in props.tabs"
                            :tab="tab"
                            :type="props.type"
                            :sorting="props.sorting"
                            :preventDragAndDrop="true"
                            :tabsetType="props.tabsetType"
                            :hide-menu="props.hideMenu"/>
  </q-list>

  <audio id="myAudio">
    <source src="mp3/click.mp3" type="audio/mp3">
  </audio>

</template>

<script setup lang="ts">
import {Tab, TabSorting} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {PropType} from "vue";
import {VueDraggableNext} from 'vue-draggable-next'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {TabsetType} from "src/models/Tabset";
import SidePanelTabListHelper from "components/layouts/sidepanel/SidePanelTabListHelper.vue";

const props = defineProps({
  tabs: {type: Array as PropType<Tab[]>, required: true},
  hideMenu: {type: Boolean, default: false},
  sorting: {type: String as PropType<TabSorting>, default: TabSorting.CUSTOM},
  type: {type: String, default: 'sidepanel'},
  preventDragAndDrop: {type: Boolean, default: false},
  tabsetType: {type: String, default: TabsetType.DEFAULT.toString()},
})

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

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
