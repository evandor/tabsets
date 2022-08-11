<template>
  <q-page padding>

    <div class="text-h6">{{ tabset.name }}</div>
    <div class="text-caption">{{ tabset.date }}</div>

    <div>
      <q-btn label="restore" @click="restore()"/>
    </div>

    <q-list bordered class="rounded-borders">
      <q-expansion-item
        expand-separator
        icon="push_pin"
        label="Pinned Tabs"
        caption="John Doe"
      >
        <q-card>
          <q-card-section>
            <Tabcards :tabs="pinned(tabs)"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <div v-for="group in getTabGroups()">
        <q-expansion-item
          v-if="tabsForGroup(tabs, group.id).length > 0"
          expand-separator>
          <template v-slot:header="{ expanded }">
            <q-item-section avatar>
              <q-icon :color="group.color" name="tab"/>
            </q-item-section>

            <q-item-section>
              <div>
                {{ group.title + ' (' + tabsForGroup(tabs, group.id).length + ')' }}
                <q-btn label="create new tabset" v-if="expanded" @click="newTabsetFrom(group.title, group.id)"/>
              </div>
            </q-item-section>
          </template>
          <q-card>
            <q-card-section>
              <Tabcards :tabs="tabsForGroup(tabs, group.id)"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>


      <q-expansion-item
        expand-separator
        icon="push_pin"
        label="Other Tabs"
        caption="John Doe"
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
import {defineComponent, onMounted, onUpdated, ref} from 'vue'
import {useRoute} from "vue-router";
import {TabsetApi} from "src/services/TabsetApi";
import {useQuasar} from "quasar";
import {Tabset} from "src/models/Tabset";
import Tabcards from "src/components/layouts/Tabcards.vue";
import _ from "lodash"
import {useTabGroupsStore} from "stores/tabGroups";
import {useTabsStore} from "stores/tabs";

const route = useRoute();
const localStorage = useQuasar().localStorage
const tabsetApi = new TabsetApi(localStorage);

const tabsetId = ref('')
const tabset = ref<Tabset>(null as unknown as Tabset)
const tabs = ref<chrome.tabs.Tab[]>(null as unknown as chrome.tabs.Tab[])

const tabGroupsStore = useTabGroupsStore()
const tabsStore = useTabsStore()

function init() {
  console.log("updating tabset", route.params.tabsetId)
  tabsetId.value = route.params.tabsetId as string
  tabset.value = tabsetApi.getTabset(tabsetId.value) || new Tabset("", "", [])
  tabs.value = tabset.value.tabs
}

init()

onUpdated(() => {
  init()
})

function pinned(tabs: chrome.tabs.Tab[]) {
  return _.filter(tabs, (t: chrome.tabs.Tab) => t.pinned)
}

function unpinnedNoGroup(tabs: chrome.tabs.Tab[]) {
  return _.filter(tabs, (t: chrome.tabs.Tab) => !t.pinned && t.groupId === -1)
}

function getTabGroups(): chrome.tabGroups.TabGroup[] {
  return tabGroupsStore.data
}

function tabsForGroup(tabs: chrome.tabs.Tab[], groupId: number): chrome.tabs.Tab[] {
  return _.filter(tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
}

function restore() {
  console.log("restoring tabset", tabset.value.id)
  tabsetApi.restore(tabset.value.id)
}

function newTabsetFrom(title: string, groupId: number) {
  console.log("creating tabset from group", groupId)
  tabsetApi.createFromGroup(tabset.value.id, title, groupId)
}
</script>
