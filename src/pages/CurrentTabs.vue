<template>
  <q-page padding>

    <q-toolbar class="text-primary">
      <q-btn flat round dense icon="tabs"/>
      <q-toolbar-title>
        Tabset:  <q-select borderless v-model="tabsetname" :options="tabsetNameOptions" label="Tabset Name" />
      </q-toolbar-title>
      <q-btn flat round dense icon="save"/>
    </q-toolbar>

    <q-list class="rounded-borders">
      <q-expansion-item
        v-if="tabsStore.pinnedTabs.length > 0"
        header-class="bg-amber-2 text-black"
        expand-icon-class="text-black"
        expand-separator
        default-opened>
        <template v-slot:header="{ expanded }">
          <q-item-section avatar>
            <q-icon name="push_pin"/>
          </q-item-section>
          <q-item-section>
            <div>
              <span class="text-weight-bold">Pinned Tabs</span>
              <div class="text-caption">this browser's window's tabs which are pinned right now</div>
            </div>
          </q-item-section>
          <q-item-section>{{ tabsStore.pinnedTabs.length }} tab(s)</q-item-section>
        </template>
        <q-card>
          <q-card-section>
            <Tabcards :tabs="tabsStore.pinnedTabs"/>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <div v-for="group in tabGroupsStore.tabGroups">
        <q-expansion-item
          v-if="tabsForGroup(group.id).length > 0"
          header-class="bg-amber-2 text-black"
          expand-icon-class="text-black"
          expand-separator
          default-opened>
          <template v-slot:header="{ expanded }">
            <q-item-section avatar>
              <q-icon :color="group.color" name="tab"/>
            </q-item-section>

            <q-item-section>
              <div>
                <span class="text-weight-bold">{{ group.title }}</span>
                <div class="text-caption">chrome browser's group of tabs</div>
                <!--                <q-btn label="create new tabset" v-if="expanded" @click="newTabsetFrom(group.title, group.id)"/>-->

              </div>
            </q-item-section>
            <q-item-section>{{ tabsForGroup(group.id).length }} tab(s)</q-item-section>
          </template>
          <q-card>
            <q-card-section>
              <Tabcards :tabs="tabsForGroup( group.id)"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>

      <q-expansion-item
        icon="tabs"
        default-opened
        header-class="bg-amber-2 text-black"
        expand-icon-class="text-black">
        <template v-slot:header="{ expanded }">
          <q-item-section avatar>
            <q-icon name="tab"/>
          </q-item-section>

          <q-item-section>
            <div>
              <span class="text-weight-bold">Other Tabs</span>
              <div class="text-caption">current tabs, neither pinned nor grouped</div>
              <!--                <q-btn label="create new tabset" v-if="expanded" @click="newTabsetFrom(group.title, group.id)"/>-->
            </div>
          </q-item-section>
          <q-item-section>{{ unpinnedNoGroup(tabsStore.tabs).length }} tab(s)</q-item-section>
        </template>
        <q-card>
          <q-card-section>
            <Tabcards :tabs="unpinnedNoGroup()"/>
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

const tabGroupsStore = useTabGroupsStore()

const tabsetname = ref('name')

const tabsetNameOptions = [
  'Google', 'Facebook', 'Twitter', 'Apple', 'Oracle'
]

function unpinnedNoGroup() {
  return _.filter(tabsStore.tabs, (t: chrome.tabs.Tab) => !t.pinned && t.groupId === -1)
}

function tabsForGroup(groupId: number): chrome.tabs.Tab[] {
  return _.filter(tabsStore.tabs, (t: chrome.tabs.Tab) => t.groupId === groupId)
}


</script>
