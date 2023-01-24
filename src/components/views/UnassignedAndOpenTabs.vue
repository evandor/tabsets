<template>

  <vue-draggable-next
    :list="unassignedTabs()"
    :group="{ name: 'tabs', pull: 'clone', put: false }"
    :sort="true">

    <div
      class="col-12 q-pa-xs items-center justify-center" style="width:100%; max-width: 300px;cursor: move"
      v-for="tab in unassignedTabs()"
      :key="tab.id">

      <OpenTabCard :tab="tab" />

    </div>

  </vue-draggable-next>

</template>
<script setup lang="ts">
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import OpenTabCard from "components/layouts/OpenTabCard.vue";
import {VueDraggableNext} from 'vue-draggable-next'

const tabsStore = useTabsStore()

function unassignedTabs(): Tab[] {
  return _.filter(
    tabsStore.pendingTabset?.tabs,
    //@ts-ignore
    (t: Tab) => {

      // if (props.filter && props.filter.trim().length > 0) {
      //   const f = props.filter.toLowerCase()
      //   const chromeTab = t.chromeTab
      //   if (chromeTab && chromeTab.title && chromeTab.title.toLowerCase().indexOf(f) >= 0) {
      //     return true
      //   }
      //   if (chromeTab && chromeTab.url && chromeTab.url.indexOf(f) >= 0) {
      //     return true
      //   }
      //   if (t.name && t.name.toLowerCase().indexOf(f) >= 0) {
      //     return true
      //   }
      //   return false
      // }
      return true
    })
}
</script>
