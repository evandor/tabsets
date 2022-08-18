<template>
  <q-page padding>

    <q-toolbar class="text-primary">
      <q-btn flat round dense icon="tabs"/>
      <q-toolbar-title>
        Tabset: Current
      </q-toolbar-title>
      <q-btn flat round dense icon="save"/>
    </q-toolbar>

    <q-list class="rounded-borders">
      <q-expansion-item
        v-if="tabsStore.pinnedTabs.length > 0"
        expand-separator
        icon="push_pin"
        label="Pinned Tabs"
        caption="John Doe"
      >
        <q-card>
          <q-card-section>
            <Tabcards :tabs="tabsStore.pinnedTabs"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>


      <q-expansion-item
        expand-separator
        icon="tabs"
        label="Other Tabs"
        default-opened
        :caption="unpinnedNoGroup(tabs).length + ' tabs'"
      >
        <q-card>
          <q-card-section>
            <Tabcards :tabs="unpinnedNoGroup(tabs)"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import {defineComponent, onMounted, onUpdated, ref, watchEffect} from 'vue'
import {useRoute} from "vue-router";
import {TabsetApi} from "src/services/TabsetApi";
import {useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import Tabcards from "src/components/layouts/Tabcards.vue";
import _ from "lodash"
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";

const route = useRoute();
const localStorage = useQuasar().localStorage
const tabsetApi = new TabsetApi(localStorage);

const tabsStore = useTabsStore()

const tabs = ref<chrome.tabs.Tab[]>(tabsStore.getTabs)

const tabGroupsStore = useTabGroupsStore()


function unpinnedNoGroup(tabs: chrome.tabs.Tab[]) {
  return _.filter(tabsStore.tabs, (t: chrome.tabs.Tab) => !t.pinned && t.groupId === -1)
}

function getTabGroups(): chrome.tabGroups.TabGroup[] {
  return tabGroupsStore.data
}

function tabsForGroup(tabs: chrome.tabs.Tab[], groupId: number): chrome.tabs.Tab[] {
  return _.filter(tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
}


</script>
