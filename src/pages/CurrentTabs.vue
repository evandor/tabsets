<template>
  <q-page padding>

    <div class="text-h6">Current</div>
    <div class="text-caption">now</div>

    <q-list bordered class="rounded-borders">
      <q-expansion-item
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

    </q-list>

    <q-expansion-item
      expand-separator
      icon="tabs"
      label="Other Tabs"
      :caption="unpinnedNoGroup(tabs).length + ' tabs'"
    >
      <q-card>
        <q-card-section>
          <Tabcards :tabs="unpinnedNoGroup(tabs)"/>
        </q-card-section>
      </q-card>
    </q-expansion-item>
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
