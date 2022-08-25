<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="drawerToggled"
        />

        <q-toolbar-title>
          <q-btn stretch flat label="Tabsets" to="/"/>
        </q-toolbar-title>

        <q-space />
        context: {{tabsStore.context}}
        <q-space />

        <q-input dark dense standout v-model="search" input-class="text-right"
                 @keydown.enter.prevent="submitSearch()"
                 class="q-ml-md">
          <template v-slot:append>
            <q-icon v-if="search === ''" name="search"/>
            <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''"/>
          </template>
        </q-input>

        <q-space/>
        <q-btn label="New Tabset..." @click="showNewTabsetDialog = true"/>
        <q-space/>
        <div>{{ appVersion }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer :model-value="drawerIsOpen" @update:model-value="drawerToggled">
      <div @click="drawerToggled">Some Content!</div>
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
          <q-input dense v-model="newTabsetName" autofocus @keyup.enter="prompt = false" />
          <q-checkbox v-model="clearTabsets" label="close current Tabs" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Create new Tabset" :disable="newTabsetName.trim().length === 0" v-close-popup @click="createNewTabset()"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Tabsets, {TabsetProps} from 'components/Tabsets.vue'
import {initializeBackendApi} from "src/services/BackendApi";
import _ from "lodash"
//import {useAuthStore} from "stores/auth";
import {useQuasar} from "quasar";
import {uid} from 'quasar'
import {TabsetApi} from "src/services/TabsetApi";
import {Tabset} from "src/models/Tabset";
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import {useRouter} from "vue-router";
import tabsetService from "src/services/TabsetService";

const router = useRouter()
//const authStore = useAuthStore()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

const contextname = ref('default')
const newTabsetName = ref('')
const search = ref('')
const showNewTabsetDialog = ref(false)
const clearTabsets = ref(false)

const localStorage = useQuasar().localStorage
const tabsetApi = new TabsetApi(localStorage)
// const appVersion = process.env.PUBLIC_ENV_PACKAGE_VERSION
const appVersion = import.meta.env.PACKAGE_VERSION

const drawerIsOpen = ref(true)
const $q = useQuasar()
async function drawerToggled () {
  console.log("here!!!", $q.bex)
  //const { data } = await $q.bex.send('some.event', { someKey: 'aValue' })
  $q.bex.send('some.event', { someKey: 'aValue' })
    .then( data =>   console.log('??? Some response from the other side <<<', data))
    .catch(ex => console.error("ex", ex))
  await $q.bex.send('wb.drawer.toggle', {
    open: drawerIsOpen.value // So it knows to make it bigger / smaller
  })

  // Only set this once the promise has resolved so we can see the entire slide animation.
  drawerIsOpen.value = !drawerIsOpen.value
}


function saveTabset() {
  /*if (authStore.isAuthenticated) {
    console.log("saving tabset @ backend");
    const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)
    backend.saveTabset(tabsStore.getTabs())
  } else {*/
  console.log("saving tabset @ localstorage");
  tabsetApi.saveOrReplace(contextname.value, tabsStore.tabs)
  //}
}

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function tabsForGroup(groupId: number): chrome.tabs.Tab[] {
  return tabsStore.tabsForGroup(groupId)
}


function tabsets(): object[] {
  const ts = tabsetApi.getTabsetInfo()
  ts.push({
    title: 'current',
    id: 'current'
  })
  return ts
}

async function submitSearch() {
  console.log("s", search.value)
  console.log("here***", $q.bex)
  const { data } = await $q.bex.send('some.event', { someKey: 'aValue' })
  console.log('>>> Some response from the other side <<<', data)
  router.push("/search/" + search.value)
}

function createNewTabset() {
  tabsetService.createNewTabset(newTabsetName.value, clearTabsets.value)
}
</script>
