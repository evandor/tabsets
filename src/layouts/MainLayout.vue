<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title>
          <q-btn stretch flat label="Tabsets" to="/"/>
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
        <q-btn label="New Tabset..."/>
        <q-space/>
        <div>{{ appVersion }}</div>
      </q-toolbar>
    </q-header>


    <q-page-container>
      <router-view/>
    </q-page-container>
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

const router = useRouter()
//const authStore = useAuthStore()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

const contextname = ref('default')
const search = ref('')

const localStorage = useQuasar().localStorage
const tabsetApi = new TabsetApi(localStorage)
// const appVersion = process.env.PUBLIC_ENV_PACKAGE_VERSION
const appVersion = import.meta.env.PACKAGE_VERSION

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

function submitSearch() {
  console.log("s", search.value)
  router.push("/search/" + search.value)
}
</script>
