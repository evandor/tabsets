<template>

  <q-separator></q-separator>

  <div class="row items-start">
    <div class="col-12 q-pa-xs" v-for="tab in unpinnedNoGroup()">
      <TabCard :tab="tab"/>
    </div>
  </div>


</template>

<script setup lang="ts">

import {Tab} from "src/models/Tab";
import TabCard from "src/components/layouts/TabCard.vue"
import _ from "lodash"
import {useTabsStore} from "stores/tabsStore";

const tabsStore = useTabsStore()

function unpinnedNoGroup(): Tab[] {
  return _.filter(
    tabsStore.browserTabset?.tabs,
    //@ts-ignore
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
}

</script>

