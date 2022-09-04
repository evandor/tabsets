<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>

        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer"/>

        <q-toolbar-title>
          <q-btn stretch flat :label="toolbarTitle()" to="/"/>
        </q-toolbar-title>

        <q-input dark dense standout v-model="search" input-class="text-right"
                 @keydown.enter.prevent="submitSearch()"
                 class="q-ml-md">
          <template v-slot:append>
            <q-icon v-if="search === ''" name="search"/>
            <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''"/>
          </template>
        </q-input>

        <q-space/>

        <div>
          <q-icon name="circle" color="green" v-if="tabsStore.listenersOn">
            <q-tooltip>Listeners are ON</q-tooltip>
          </q-icon>
          <q-icon name="circle" color="red" v-else>
            <q-tooltip>Listeners are OFF</q-tooltip>
          </q-icon>
        </div>
        <q-space/>
        <div>{{ appVersion }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <div class="q-pa-md q-gutter-sm">

        <div class="text-body1 q-mt-lg"><b>Active Tabset</b></div>
        <div v-for="tabset in tabsStore.tabsets.values()">
          <q-btn v-if="tabsStore.contextId === tabset.id"
                 text-color="black"
                 color="white"
                 :label="tabsStore.getNameForContext + ' ('+tabset.tabs.length+')'"
                 @click="selectTabset(tabsStore.contextId)"
                 class="full-width"
                 :style="tabsStore.contextId === tabsStore.currentTabsetId ? 'border:1px solid blue' : 'border:1px solid #bfbfbf'"/>
        </div>
        <div v-if="!tabsStore.contextId">
          <q-btn
            text-color="black"
            label="no tabset selected"
            disable
            class="full-width"
            style="border:1px solid #bfbfbf">

          </q-btn>
          <q-tooltip>if you define one of your tabsets to be your 'context',<br>
            all subsequent changes of your tabs will be tracked.
          </q-tooltip>
        </div>

        <div class="q-mt-lg" v-if="tabsStore.contextId ? tabsStore.tabsets.size > 2 : tabsStore.tabsets.size > 1">
            <span class="text-body1" v-if="tabsStore.contextId">
              <b>Other Tabsets</b>
            </span>
            <span class="text-body1" v-else>
              <b>Tabsets</b>
            </span>
        </div>

        <div v-for="tabset in tabsStore.tabsets.values()">
          <q-btn v-if="tabset.name !== 'current' && tabset.id !== tabsStore.contextId"
                 text-color="black"
                 color="white"
                 :label="tabset.name + ' ('+tabset.tabs.length+', ' + nonDefaultCount(tabset.tabs) + ')'"
                 @click="selectTabset(tabset.id)"
                 class="full-width"
                 :style="tabset.id === tabsStore.currentTabsetId ? 'border:1px solid blue' : 'border:1px solid #bfbfbf'"/>
        </div>

        <div class="text-body1 q-mt-lg"><b>Current Browser Tabs</b></div>
        <div v-for="tabset in tabsStore.tabsets.values()">
          <q-btn
            v-if="tabset.name === 'current'"
            text-color="black"
            color="white"
            :label="'Browser ('+tabset.tabs.length+')'"
            @click="selectTabset(tabset.id)"
            class="full-width"
            :style="tabset.id === tabsStore.currentTabsetId ? 'border:1px solid blue' : 'border:1px solid #bfbfbf'"/>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>

    <q-dialog v-model="showNewTabsetDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Create a new tabset</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">You can keep the currently open tabs or close them all.</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body">New Tabset's name:</div>
          <q-input dense v-model="newTabsetName" autofocus @keyup.enter="prompt = false"/>
          <q-checkbox v-model="clearTabsets" label="close current Tabs"/>
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup/>
          <q-btn flat label="Create new Tabset" :disable="newTabsetName.trim().length === 0" v-close-popup
                 @click="createNewTabset()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useQuasar} from "quasar";
import {TabsetApi} from "src/services/TabsetApi";
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useRouter} from "vue-router";
import tabsetService from "src/services/TabsetService";
import TabsetService from "src/services/TabsetService";
import _ from "lodash"
import {useMeta} from 'quasar'
import {Tab, TabStatus} from "src/models/Tab";

const router = useRouter()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

const newTabsetName = ref('')
const search = ref('')
const showNewTabsetDialog = ref(false)
const showCloseTabsDialog = ref(false)
const clearTabsets = ref(false)

const localStorage = useQuasar().localStorage
const tabsetApi = new TabsetApi(localStorage)
const appVersion = import.meta.env.PACKAGE_VERSION
const leftDrawerOpen = ref(true)

useMeta(() => {
  return {
    title: tabsStore.title
  }
})

function saveTabset() {
  /*if (authStore.isAuthenticated) {
    console.log("saving tabset @ backend");
    const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)
    backend.saveTabset(tabsStore.getTabs())
  } else {*/
  console.log("saving tabset @ localstorage");
  //tabsetApi.saveOrReplace(contextname.value, tabsStore.tabs)
  //}
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function tabsForGroup(groupId: number): chrome.tabs.Tab[] {
  return tabsStore.tabsForGroup(groupId)
}

function tabsets(): object[] {
  const ts = tabsetApi.getTabsetInfo()
  return ts
}

async function submitSearch() {
  console.log("s", search.value)
  router.push("/search/" + search.value)
}

function createNewTabset() {
  tabsetService.createNewTabset(newTabsetName.value, clearTabsets.value)
}

const toolbarTitle = () => tabsStore.getNameForContext !== 'undefined' ?
  "Context: " + tabsStore.getNameForContext + " (Tracking: active)" :
  "Tabsets (No Tracking of tabs)"

const selectTabset = (tabsetId: string) => {
  TabsetService.selectTabset(tabsetId)
  router.push("/tabset")
}

const nonDefaultCount = (tabs: Tab[]) => _.filter(tabs, t => t.status !== TabStatus.DEFAULT).length

</script>
