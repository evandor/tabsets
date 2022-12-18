<template>

  <!--  <q-separator></q-separator>-->

  <!--  @end="end"-->
  <vue-draggable-next
    :list="unpinnedNoGroup()"
    :group="{ name: 'tabs', pull: 'clone', put: false }"

    :sort="true">

    <div
      class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
      v-for="tab in unpinnedNoGroup()"
      :key="tab.id">

      <OpenTabCard :tab="tab" />

    </div>

  </vue-draggable-next>

</template>

<script setup lang="ts">

import {Tab} from "src/models/Tab";
import OpenTabCard from "components/layouts/OpenTabCard.vue"
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore"
import {VueDraggableNext} from 'vue-draggable-next'

const props = defineProps({
  filter: {
    type: String,
    required: false
  }
})

const tabsStore = useTabsStore()

function unpinnedNoGroup(): Tab[] {
  return _.filter(
    tabsStore.browserTabset?.tabs,
    //@ts-ignore
    (t: Tab) => {

      if (props.filter && props.filter.trim().length > 0) {
        const f = props.filter.toLowerCase()
        const chromeTab = t.chromeTab
        if (chromeTab && chromeTab.title && chromeTab.title.toLowerCase().indexOf(f) >= 0) {
          return true
        }
        if (chromeTab && chromeTab.url && chromeTab.url.indexOf(f) >= 0) {
          return true
        }
        if (t.name && t.name.toLowerCase().indexOf(f) >= 0) {
          return true
        }
        return false
      }

      return true//!t.chromeTab.pinned && t.chromeTab.groupId === -1
    })
}

const handleMove = (a: any) => console.log("handleMove1 a", a)
const end = (a: any) => console.log("a2", a)

</script>
