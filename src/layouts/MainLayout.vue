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
          <!--          <q-icon name="circle" :color="tabsStore.active ? 'green' : 'red'">-->
          <!--            <q-tooltip v-if="tabsStore.active">Your tabs are being monitored, changes are logged in this extension.-->
          <!--            </q-tooltip>-->
          <!--            <q-tooltip v-if="!tabsStore.active">Your tabs are not being tracked right now.</q-tooltip>-->
          <!--          </q-icon>-->
          <q-btn stretch flat :label="toolbarTitle()" to="/"/>
        </q-toolbar-title>


        <q-space/>

        <q-space/>


        <q-toggle
          left-label
          color="green"
          v-model="tabsStore.active"
          label=""
        />

        <div v-if="tabsStore.active" class="q-mr-lg">Tracking active&nbsp;
          <q-badge v-if="tabsStore.pendingTabset?.tabs.length > 0"
                   align="top" color="red" class="q-mr-lg">{{ tabsStore.pendingTabset?.tabs.length }}
            <q-tooltip>There are pending tabs, which can be assigned to a tabset</q-tooltip>
          </q-badge>
        </div>
        <div v-if="!tabsStore.active" class="q-mr-lg">Tracking stopped
          <q-badge v-if="tabsStore.pendingTabset?.tabs.length > 0"
                   align="top" color="grey" class="q-mr-lg">{{ tabsStore.pendingTabset?.tabs.length }}
            <q-tooltip>Tracking has stopped, but there are some pending tabs which can be assigned to a tabset</q-tooltip>
          </q-badge>
        </div>
        <div>
          <q-badge outline align="middle" color="white">
            v{{ appVersion }}
          </q-badge>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <Navigation></Navigation>

    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>

    <q-footer class="bg-white text-black">
      <div class="q-ma-sm">
        {{ notificationsStore.info }}
        <TabInfo></TabInfo>
      </div>
    </q-footer>

  </q-layout>
</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useQuasar} from "quasar";
import {TabsetApi} from "src/services/TabsetApi";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useRouter} from "vue-router";
import _ from "lodash"
import {useMeta} from 'quasar'
import {Tab, TabStatus} from "src/models/Tab";
import {useNotificationsStore} from "stores/notificationsStore";
import TabInfo from "src/components/layouts/TabInfo.vue"
import Navigation from "src/components/Navigation.vue"

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
//@ts-ignore
const appVersion = import.meta.env.PACKAGE_VERSION
const leftDrawerOpen = ref(true)

useMeta(() => {
  return {
    title: tabsStore.title
  }
})

watchEffect(() => {
  if (tabsStore.active !== null) {
    localStorage.set("active", tabsStore.active)
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

// function createNewTabset() {
//   tabsetService.createNewTabset(newTabsetName.value, clearTabsets.value)
// }

const toolbarTitle = () => tabsStore.getNameForContext !== 'undefined' ?
  'Tabset: ' + tabsStore.getNameForContext :
  "Tabsets"


const nonDefaultCount = (tabs: Tab[]) => _.filter(tabs, t => t.status !== TabStatus.DEFAULT).length
const captionMessage = (msg: string) => console.log("msg", msg)

</script>
