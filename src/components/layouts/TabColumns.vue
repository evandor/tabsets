<template>

  <div class="flex justify-center">
    <TabColumn label="..." :tabs="unpinnedNoGroup()"/>
    <TabColumn label="pinned" :tabs="tabsStore.pinnedTabs"/>
    <TabColumn label="test"
               v-for="group in tabGroupsStore.tabGroups"
               :tabs="tabsForGroup( group.id)"/>
  </div>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import {ref, watchEffect} from "vue";
import TabColumn from "src/components/layouts/TabColumn.vue"
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useRoute} from "vue-router";

const $q = useQuasar()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const route = useRoute()

const thumbnails = ref<Map<string, string>>(new Map())

const tabsetId = ref(null as unknown as string)

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  if (tabsetId.value) {
    console.debug("got tabset id", tabsetId.value)
    tabsStore.selectCurrentTabset(tabsetId.value)
  }
})

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t),
    // @ts-ignore
    (t: Tab) => !t?.chromeTab.pinned && t?.chromeTab.groupId === -1)
}

function tabsForGroup(groupId: number): Tab[] {
  return _.filter(tabsStore.getTabset(tabsetId.value)?.tabs,
    //@ts-ignore
    (t: Tab) => t?.chromeTab.groupId === groupId)
}

</script>

<style lang="sass" scoped>
</style>
