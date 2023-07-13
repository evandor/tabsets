<template>
  {{ tabs }}
  <q-list separator class="q-ma-none">
    <vue-draggable-next
      class="q-ma-none"
      :list="tabs"
      :group="{ name: 'tabs', pull: 'clone' }"
      @change="handleDragAndDrop">

      <!--      :style="itemStyle(tab)"-->
      <!--      @click.stop="showDetails(tab)"-->
      <!--      @dragstart="startDrag($event, tab)"-->
      <q-item
        clickable
        v-ripple
        v-for="tab in tabs"
        class="q-ma-none q-pa-sm"

        :key="'paneltablist_' + tab.id">

        <!--        <PanelTabListElementWidget :key="'ptlew__' + tab.id"-->
        <!--                                   :tab="tabAsTab(tab)"-->
        <!--                                   :type="props.type"-->
        <!--                                   :hide-menu="props.hideMenu"/>-->
        ********
      </q-item>
    </vue-draggable-next>
  </q-list>
</template>
<script setup lang="ts">

import {Tab} from "src/models/Tab";
import {VueDraggableNext} from "vue-draggable-next";
import { ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {useTabsStore} from "stores/tabsStore";

const props = defineProps({
  tabsetId: {type: String, required: true}
})

const tabs = ref<Tab[]>([])

watchEffect(() => {
  console.log("watching >>> ", props.tabsetId)
})

const load = (tabsetId: string) => {
  console.log("loading", tabsetId)
  tabs.value = useTabsStore().getTabset(tabsetId)?.tabs || []
  console.log("got", tabs.value)
}

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

defineExpose({
  load
});
</script>
