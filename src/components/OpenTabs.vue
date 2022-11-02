<template>

  <q-separator></q-separator>

<!--  <div class="row items-start">-->
<!--    <div class="col-12 q-pa-xs" v-for="tab in unpinnedNoGroup()">-->
<!--      <OpenTabCard :tab="tab"/>-->
<!--    </div>-->
<!--  </div>-->


  <vue-draggable-next
    :list="unpinnedNoGroup()"
    :group="{ name: 'people', pull: 'clone', put: false }"
    :sort="true"
    @change="log"
    :move="checkMove"
  >
    <div
      class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 260px;cursor: move"
      v-for="tab in unpinnedNoGroup()"
      :key="tab.id">
      <OpenTabCard :tab="tab"/>
    </div>
  </vue-draggable-next>


</template>

<script setup lang="ts">

import {Tab} from "src/models/Tab";
import OpenTabCard from "components/layouts/OpenTabCard.vue"
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore"
import {VueDraggableNext} from 'vue-draggable-next'
import {ref} from "vue";

const tabsStore = useTabsStore()

function unpinnedNoGroup(): Tab[] {
  return _.filter(
    tabsStore.browserTabset?.tabs,
    //@ts-ignore
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
}


const startDrag = (evt: DragEvent, tab: Tab) => {
  console.log("drag started", evt, tab)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'move'
    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', tab.id)
  }
}
const enabled = ref(true)

const log = (event: any) => {
  console.log("event", event)
  const {moved, added} = event
  if (moved) console.log('moved', moved)
  if (added) console.log('added', added, added.element)
}

const add = () => {
  console.log('add')
}
const replace = () => {
  console.log('replace')
}
const checkMove = (event: any) => {
  console.log('checkMove', event.draggedContext)
  console.log('Future index: ' + event.draggedContext.futureIndex)
}

</script>
