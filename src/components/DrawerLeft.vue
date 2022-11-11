<template>
  <q-tabs
    v-model="tab"
    dense
    class="bg-grey-1 text-primary shadow-2"
  >
    <q-tab name="bookmarks" label="Bookmarks"/>
    <q-tab name="openTabs" label="Open Tabs"/>
    <q-tab name="savedTabs" label="Saved Tabs"/>
  </q-tabs>

  <BookmarksTree v-if="tab === 'bookmarks'"/>

  <OpenTabs v-else-if="tab === 'openTabs'" />

  <div v-else>
    <q-btn @click="openSavedTab" label="open" />
  </div>

</template>

<script lang="ts" setup>
import {ref, watchEffect} from "vue";
import BookmarksTree from "src/components/BookmarksTree.vue"
import OpenTabs from "src/components/OpenTabs.vue"
import {useNotificationsStore} from "stores/notificationsStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";

const tab = ref('bookmarks')

watchEffect(() => {
  tab.value = useNotificationsStore().showOpenTabs ? 'openTabs' : 'bookmarks'
})

const openSavedTab = () => {
  IndexedDbPersistenceService.getMhtml("aHR0cHM6Ly93d3cud2lraXBlZGlhLm9yZy8=")
}

</script>
