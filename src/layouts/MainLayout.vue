<template>
  <q-layout view="hHh lpR lFf">
    <q-header elevated>
      <q-toolbar>

<!--        <q-btn dense flat round icon="menu" v-if="!toggleLeftDrawer" @click="toggleLeftDrawer"/>-->

        <q-input dark dense standout v-model="search" input-class="text-right"
                 style="width:260px;"
                 v-if="tabsStore.tabsets.size > 1"
                 @keydown.enter.prevent="submitSearch()"
                 class="q-ml-md">
          <template v-slot:prepend>
            <q-icon v-if="search === ''" name="search"/>
            <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''"/>
          </template>
        </q-input>

        <q-toolbar-title style="position:absolute;left:300px;">
          <q-btn stretch flat :label="toolbarTitle()" to="/"/>
        </q-toolbar-title>


        <q-space/>

        <div>
          <!--          <q-icon name="circle" color="green" v-if="tabsStore.listenersOn">-->
          <!--            <q-tooltip>Listeners are ON</q-tooltip>-->
          <!--          </q-icon>-->
          <!--          <q-icon name="circle" color="red" v-else>-->
          <!--            <q-tooltip>Listeners are OFF</q-tooltip>-->
          <!--          </q-icon>-->
        </div>
        <q-space/>
        <div>{{ appVersion }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>

      <q-list style="max-width: 318px" class="q-mt-md">
        <q-expansion-item
          expand-separator
          icon="tabs"
          label="Tabsets"
          default-opened
        >

          <q-item clickable v-ripple v-for="tabset in tabsStore.tabsetsWithoutCurrent" @click="selectTabset(tabset.id)"
                  :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
            <q-item-section>
              <q-item-label overline :class="tabsStore.contextId === tabset.id ? 'text-blue-9' : ''"
                            v-text="tabset.tabs.length > 1 ? tabset.name + ' (' + tabset.tabs.length + ' tabs)' : tabset.name + ' (' + tabset.tabs.length + ' tab)'"/>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="selectTabset('current')"
                  :style="'current' === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">
            <q-item-section>
              <q-item-label overline
                            v-text="tabsStore.tabs.length > 1 ? 'Open tabs (' + tabsStore.tabs.length + ' tabs)' : 'Open tabs (' + tabsStore.tabs.length + ' tab)'"/>
            </q-item-section>
          </q-item>
        </q-expansion-item>
      </q-list>

    </q-drawer>

    <q-page-container >
      <router-view />
    </q-page-container>

    <q-footer class="bg-white text-black">
      <div class="q-ma-sm">
        {{notificationsStore.info}}
      </div>
    </q-footer>

  </q-layout>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useQuasar} from "quasar";
import {TabsetApi} from "src/services/TabsetApi";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useRouter} from "vue-router";
import tabsetService from "src/services/TabsetService";
import TabsetService from "src/services/TabsetService";
import _ from "lodash"
import {useMeta} from 'quasar'
import {Tab, TabStatus} from "src/models/Tab";
import {useNotificationsStore} from "stores/notificationsStore";

const router = useRouter()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const notificationsStore = useNotificationsStore()


const newTabsetName = ref('')
const caption = ref('yyy')
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
  'Tabset: ' + tabsStore.getNameForContext :
  "Tabsets"

const selectTabset = (tabsetId: string) => {
  TabsetService.selectTabset(tabsetId)
  router.push("/tabset")
}

const nonDefaultCount = (tabs: Tab[]) => _.filter(tabs, t => t.status !== TabStatus.DEFAULT).length
const captionMessage = (msg: string) => console.log("msg", msg)

</script>
