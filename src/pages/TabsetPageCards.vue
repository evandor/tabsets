<template>
  <q-card flat v-if="tabsStore.getCurrentTabset?.view !== 'canvas'">
    <q-card-section>

      <TabList v-if="tabsStore.getCurrentTabset?.view === 'list'"
               group="otherTabs"
               :highlightUrl="highlightUrl"
               :tabs="unpinnedNoGroupOrAllTabs()"/>

      <TabTable v-else-if="tabsStore.getCurrentTabset?.view === 'table'"
                group="otherTabs"
                :highlightUrl="highlightUrl"
                :tabs="unpinnedNoGroupOrAllTabs()"/>

      <TabGroups v-else-if="tabsStore.getCurrentTabset?.view === 'group'"
                 group="otherTabs"
                 :highlightUrl="highlightUrl"
                 :tabs="unpinnedNoGroupOrAllTabs()"/>

      <TabsExporter v-else-if="tabsStore.getCurrentTabset?.view === 'exporter'"
                    group="otherTabs"
                    :tabs="unpinnedNoGroupOrAllTabs()"/>

    </q-card-section>

  </q-card>


  <q-card v-if="tabsStore.getCurrentTabset?.view === 'canvas'">
    <q-card-section>
      <TabsCanvas :key="'tabCanvas_' + tabsStore.currentTabsetId"/>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>

import TabList from "components/layouts/TabList.vue";
import TabTable from "components/layouts/TabTable.vue";
import TabGroups from "components/layouts/TabGroups.vue";
import TabsExporter from "components/layouts/TabsExporter.vue";
import {useTabsStore} from "stores/tabsStore";
import {ref, watchEffect} from "vue";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import PageForTabset from "components/layouts/PageForTabset.vue";
import TabsCanvas from "components/layouts/TabsCanvas.vue";
import {useUiStore} from "stores/uiStore";
import {useRoute} from "vue-router";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";

const tabsStore = useTabsStore()
const route = useRoute()

const highlightUrl = ref('')
const orderDesc = ref(false)
const tabsetId = ref(null as unknown as string)

watchEffect(() => {
  if (!route || !route.query) {
    return
  }
  const highlight = route?.query['highlight'] as unknown as string
  if (highlight && highlight.length > 0) {
    try {
      // highlightUrl.value = atob(highlight)
      useUiStore().addHighlight(atob(highlight))
    } catch (e: any) {
      console.error("highlight error", e)
    }
  }
})

watchEffect(() => {
  const highlightUrls: string[] = useUiStore().getHighlightUrls
  if (highlightUrls.length > 0) {
    console.log("found hightlight", highlightUrls)
    highlightUrl.value = highlightUrls[0]
  } else {
    highlightUrl.value = ''
  }
})

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  tabsetId.value = route?.params.tabsetId as string
  if (tabsetId.value) {
    console.debug("got tabset id", tabsetId.value)
    const ts = tabsStore.selectCurrentTabset(tabsetId.value)
  }
})

function unpinnedNoGroupOrAllTabs(): Tab[] {
  return _.orderBy(tabsStore.getCurrentTabs, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
}

function getOrder() {
  if (tabsStore.getCurrentTabset) {
    switch (tabsStore.getCurrentTabset?.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.chromeTab.url?.replace("https://", "").replace("http://", "").toUpperCase()
        break
      case 'alphabeticalTitle':
        return (t: Tab) => t.chromeTab.title?.toUpperCase()
        break
      default:
        return (t: Tab) => 1
    }
    return (t: Tab) => 1
  }
}

function tabsForGroup(groupId: number): Tab[] {
  return _.orderBy(
    _.filter(
      tabsStore.getTabset(tabsetId.value)?.tabs,
      // @ts-ignore
      (t: Tab) => t?.chromeTab.groupId === groupId),
    getOrder(), [orderDesc.value ? 'desc' : 'asc'])
}

const toggleSorting = () => useCommandExecutor().executeFromUi(new ToggleSortingCommand(tabsetId.value))

const toggleOrder = () => orderDesc.value = !orderDesc.value

const sortingInfo = (): string => {
  switch (tabsStore.getCurrentTabset?.sorting) {
    case 'custom':
      return ", sorted by Index" + (orderDesc.value ? ', descending' : '')
      break
    case 'alphabeticalUrl':
      return ", sorted by URL" + (orderDesc.value ? ', descending' : '')
      break
    case 'alphabeticalTitle':
      return ", sorted by Title" + (orderDesc.value ? ', descending' : '')
      break
    default:
      return "";
      break
  }
}

</script>
