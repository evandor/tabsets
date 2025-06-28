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
    <q-tab name="list" label="As List" @click="setView('list')" />
  </q-tabs>

  <q-tab-panels v-model="tab" animated>
    <q-tab-panel class="q-ma-none q-pa-none" name="grid">
      <TabsetPageCards :tabset="tabset" :tabsetFolder="tabsetFolder" :key="tabsetFolder.id" :simple-ui="false" />
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
import { uid } from 'quasar'
import Analytics from 'src/core/utils/google-analytics'
import { Tabset } from 'src/tabsets/models/Tabset'
import TabList from 'src/tabsets/pages/pwa/TabList.vue'
import TabsetPageCards from 'src/tabsets/pages/pwa/TabsetPageCards.vue'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabsetId = ref(null as unknown as string)
const folderId = ref<string | undefined>(undefined)
const tabset = ref<Tabset>(new Tabset(uid(), 'empty', []))
const tabsetFolder = ref<Tabset>(new Tabset(uid(), 'empty', []))

const tab = ref('')

const onMessageListener = (request: any, sender: chrome.runtime.MessageSender, sendResponse: any) =>
  onMessage(request, sender, sendResponse)

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
})

onUnmounted(() => {
  console.log('--- removing message listener ---')
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  chrome.runtime.onMessage.removeListener(onMessageListener)
})

watchEffect(() => {
  if (useTabsetsStore().loaded) {
    // initial setup from route params
    tabsetId.value = route?.params.tabsetId as string
    console.log('got tabsetId', tabsetId.value)
    tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), 'empty', [])
    tab.value = tabset.value.view || 'grid'
    folderId.value = tabset.value.folderActive
    tabsetFolder.value = useTabsetsStore().getActiveFolder(tabset.value, folderId.value) || tabset.value
  }
})

const setView = (view: string) => TabsetService.setView(tabsetId.value, view)

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
