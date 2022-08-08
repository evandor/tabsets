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
          Quasar App
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered>

      <div class="q-pa-sm" style="max-width: 350px">

        <q-btn @click="saveTabset">Save</q-btn>
        <q-btn to="login">Login</q-btn>

        <q-list bordered class="rounded-borders">
          <q-expansion-item
            expand-separator
            icon="push_pin"
            :label="'Pinned Tabs (' +  pinnedBookmarks().length + ')'"
            caption="John Doe"
          >
            <q-card>
              <q-card-section>
                <Tabs
                  v-for="link in pinnedBookmarks()"
                  :key="link.id"
                  v-bind="link"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item v-for="group in getTabGroups()"
                            expand-separator>
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon :color="group.color" name="tab" />
              </q-item-section>

              <q-item-section>
                {{ group.title + ' (' +  tabsForGroup(group.id).length + ')' }}
              </q-item-section>
            </template>

            <q-card>
              <q-card-section>
                <Tabs
                  v-for="link in tabsForGroup(group.id)"
                  :key="link.id"
                  v-bind="link"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-expansion-item
            expand-separator
            icon="push_pin"
            :label="'Other Tabs (' +  otherTabs().length + ')'"
            caption="John Doe"
          >
            <q-card>
              <q-card-section>
                <Tabs
                  v-for="link in otherTabs()"
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
          Essential Bookmarks - {{ tabsStore.tabsCount }}
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
import {initializeBackendApi} from "src/services/BackendApi";
import _ from "lodash"
import {useTabsStore} from "stores/tabs";
import {useTabGroupsStore} from "stores/tabGroups";

const tabsStore = useTabsStore();
const tabGroupsStore = useTabGroupsStore();

function saveTabset() {
  console.log("saving tabset");
  const backend = initializeBackendApi(process.env.BACKEND_URL || "unknown", null)
  backend.saveTabset(tabsStore.getTabs())
}

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function pinnedBookmarks(): chrome.tabs.Tab[] {
  return tabsStore.pinnedTabs
}

function tabsForGroup(groupId: number): chrome.tabs.Tab[] {
  return tabsStore.tabsForGroup(groupId)
}

function getTabGroups(): chrome.tabGroups.TabGroup[] {
  return tabGroupsStore.data
}
function otherTabs(): chrome.tabs.Tab[] {
  return tabsStore.unpinnedTabsWithoutGroup()
}
</script>
