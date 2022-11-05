<template>

  <q-separator></q-separator>

<!--  <div class="row items-start">-->
<!--    <div class="col-12 q-pa-xs" v-for="tab in unpinnedNoGroup()">-->
<!--      <OpenTabCard :tab="tab"/>-->
<!--    </div>-->
<!--  </div>-->

<!--  @end="end"-->
  <vue-draggable-next
    :list="unpinnedNoGroup()"
    :group="{ name: 'tabs', pull: 'clone', put: false }"

    :sort="true">

    <div
      class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
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

const tabsStore = useTabsStore()

function unpinnedNoGroup(): Tab[] {
  return _.filter(
    tabsStore.browserTabset?.tabs,
    //@ts-ignore
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
}

const handleMove = (a: any) => console.log("handleMove1 a", a)
const end = (a: any) => console.log("a2", a)

</script>
