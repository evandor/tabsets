<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <q-btn stretch flat label="Tabsets" to="/"/>
        </q-toolbar-title>

        <div>0.0.1</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered>

      <div class="q-pa-sm" style="max-width: 350px">

<!--        <q-btn @click="saveTabset">Save</q-btn>-->
<!--        <q-btn to="login">Login</q-btn>-->

        <div class="row">
          <div class="col-10">
            <q-input v-model="contextname" label="currentContext"></q-input>
          </div>
          <div class="col-2">
            <q-btn @click="saveTabset">
              <q-icon name="save"/>
            </q-btn>
          </div>
        </div>

        <q-list bordered class="rounded-borders">


          <q-expansion-item
            expand-separator
            icon="push_pin"
            :label="'Tabsets (' +  tabsets().length + ')'"
            caption="John Doe"
          >
            <q-card>
              <q-card-section>
                <Tabsets
                  v-for="link in tabsets()"
                  :key="link.id"
                  v-bind="link"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>

        </q-list>

      </div>

      <q-list>
        <q-item-label
          header
        >
          Count - {{ tabsStore.tabsCount }}
        </q-item-label>


      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Tabs, {TabProps} from 'components/Tabs.vue';
import Tabsets, {TabsetProps} from 'components/Tabsets.vue'
import {initializeBackendApi} from "src/services/BackendApi";
import _ from "lodash"
import {useTabsStore} from "stores/tabs";
import {useTabGroupsStore} from "stores/tabGroups";
import {useAuthStore} from "stores/auth";
import {useQuasar} from "quasar";
import {uid} from 'quasar'
import {TabsetApi} from "src/services/TabsetApi";
import {Tabset} from "src/models/Tabset";

const authStore = useAuthStore()
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()

const contextname = ref('default')

const localStorage = useQuasar().localStorage
const tabsetApi = new TabsetApi(localStorage)

function saveTabset() {
  if (authStore.isAuthenticated) {
    console.log("saving tabset @ backend");
    const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)
    backend.saveTabset(tabsStore.getTabs())
  } else {
    console.log("saving tabset @ localstorage");
    tabsetApi.saveOrReplace(contextname.value, tabsStore.tabs)
  }
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
    id: ''
  })
  return ts
}
</script>
