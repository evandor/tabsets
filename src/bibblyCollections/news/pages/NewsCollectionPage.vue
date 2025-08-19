<template>
  <!-- MainPanelTabsetOverviewPage -->
  <q-toolbar>
    <div class="row fit">
      <div class="col-8 q-mt-xs">
        <q-toolbar-title>
          Gallery <em>{{ toolbarTitle() }}</em>
        </q-toolbar-title>
      </div>
      <div class="col-4 text-right"></div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <q-tabs v-model="tab" dense class="text-grey q-ma-none q-pa-none" align="left" narrow-indicator>
    <q-tab name="grid" label="As Grid" @click="setView('grid')" />
    <q-tab name="newsfeed" label="News Feed" @click="setView('newsfeed')" />
    <q-tab name="list" label="As List" @click="setView('list')" />
  </q-tabs>

  <q-tab-panels v-model="tab" animated>
    <q-tab-panel class="q-ma-none q-pa-none" name="grid">
      <TabsetPageCards :tabset="tabset" :tabsetFolder="tabsetFolder" :key="tabsetFolder.id" :simple-ui="false" />
    </q-tab-panel>

    <q-tab-panel class="q-ma-none q-pa-none q-mt-md" name="newsfeed">
      <div class="row">
        <div class="col-4" v-for="feed in feeds">
          <div class="q-ma-sm" style="border: 1px solid grey; border-radius: 5px">
            <div class="q-ma-md">{{ feed }}</div>
            <RssFeed :url="feed" />
          </div>
        </div>
      </div>
    </q-tab-panel>

    <q-tab-panel class="q-ma-none q-pa-none" name="list">
      <TabList
        group="otherTabs"
        :tabsetId="tabsetFolder.id"
        :tabset="tabset"
        :tabsetSorting="tabset.sorting"
        :tabsetSharedId="tabset.sharing?.sharedId!"
        :tabs="tabsetFolder.tabs" />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script setup lang="ts">
import { uid, useMeta } from 'quasar'
import RssFeed from 'src/bibblyCollections/news/components/RssFeed.vue'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import Analytics from 'src/core/utils/google-analytics'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { SystemContentClassification } from 'src/tabsets/models/types/ContentClassification'
import TabList from 'src/tabsets/pages/pwa/TabList.vue'
import TabsetPageCards from 'src/tabsets/pages/pwa/TabsetPageCards.vue'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTagsService } from 'src/tags/TagsService'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabsetId = ref(null as unknown as string)
const folderId = ref<string | undefined>(undefined)
const tabset = ref<Tabset>(new Tabset(uid(), 'empty', []))
const tabsetFolder = ref<Tabset>(new Tabset(uid(), 'empty', []))
const feeds = ref<string[]>([])

const tab = ref('')
const title = ref('Tabsets')

const onMessageListener = (request: any, sender: chrome.runtime.MessageSender, sendResponse: any) =>
  onMessage(request, sender, sendResponse)

useMeta(() => {
  return {
    title: title.value,
  }
})

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelTabsetPage', document.location.href)
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  console.log('--- adding/resetting message listener ---', chrome.runtime.onMessage.hasListener(onMessageListener))
  //chrome.runtime.onMessage.removeListener(onMessageListener)
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  chrome.runtime.onMessage.addListener(onMessageListener)

  if (!route || !route.params) {
    return
  }
  // initial setup from route params
  tabsetId.value = route?.params.tabsetId as string
  tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), 'empty', [])
  tab.value = tabset.value.view || 'grid'
  folderId.value = tabset.value.folderActive
  tabsetFolder.value = useTabsetsStore().getActiveFolder(tabset.value, folderId.value) || tabset.value
  title.value = tabset.value.name

  // Fallback Bibbly Collection
  if (!tabsetId.value) {
    const bibblyCollection: SystemContentClassification = route.path
      .replace('/mainpanel/', '')
      .replace('/', ':') as SystemContentClassification
    console.log('bibblyCollection', bibblyCollection)
    tabset.value = useTabsetsStore().getTabset(bibblyCollection) || new Tabset(uid(), 'empty2', [])
    console.log('tabset.value', tabset.value)
    if (tabsetFolder.value) {
      tabsetFolder.value.tabs = useTagsService()
        .getTabsWithClassification(bibblyCollection)
        .map((iT: IndexedTab) => iT.tab)
      if (tabsetFolder.value) {
        feeds.value = Array.from(
          new Set(
            tabsetFolder.value.tabs.flatMap((ts: Tab) => {
              return ts.tabReferences
                .filter((tR: TabReference) => tR.type === TabReferenceType.RSS)
                .map((tR: TabReference) => tR.href)
                .filter((href: string | undefined) => href !== undefined)
            }),
          ),
        )
      }
    }
  }
})

onUnmounted(() => {
  console.log('--- removing message listener ---')
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  chrome.runtime.onMessage.removeListener(onMessageListener)
})

const setView = (view: string) => {
  //TabsetService.setView(tabsetId.value, view)
  const tabset = useTabsetsStore().getTabset(tabsetId.value)
  if (tabset) {
    tabset.view = view
    useTabsetService().saveTabset(tabset)
  }
}

const onMessage = async (request: any, sender: chrome.runtime.MessageSender, sendResponse: any) => {
  console.log(` <<< got message '${request.name}'`, request)
  if (request.name === 'tabsets.app.change.currentTabset') {
    tabset.value = await useTabsetService().reloadTabset(tabset.value.id)
    tabsetFolder.value = useTabsetsStore().getActiveFolder(tabset.value) || tabset.value
  }
  return true
}

const toolbarTitle = () => {
  return tabset.value.id === tabsetFolder.value.id
    ? tabset.value.name
    : tabset.value.name + ' / ' + tabsetFolder.value.name
}
</script>
