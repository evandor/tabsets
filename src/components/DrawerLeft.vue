<template>
  <q-tabs
    v-model="tab"
    dense
    class="bg-grey-1 text-primary shadow-2"
  >
    <q-tab name="bookmarks" icon="o_bookmark" color="positive">
      <q-tooltip>Your bookmarks</q-tooltip>
    </q-tab>
    <q-tab name="openTabs" icon="o_table_rows" >
      <q-tooltip>Your open tabs</q-tooltip>
    </q-tab>
    <q-tab name="savedTabs" icon="o_save">
      <q-tooltip>Your saved tabs</q-tooltip>
    </q-tab>
  </q-tabs>

  <BookmarksTree v-if="tab === 'bookmarks'"/>

  <OpenTabs v-else-if="tab === 'openTabs'" />

  <SavedTabs v-else />

<!--  <div>-->
<!--    <q-btn @click="openSavedTab" label="open" />-->
<!--    <br>-->
<!--    <q-btn @click="openSavedTabInline" label="open" />-->
<!--  </div>-->

</template>

<script lang="ts" setup>
import {ref, watchEffect} from "vue";
import BookmarksTree from "src/components/BookmarksTree.vue"
import OpenTabs from "src/components/OpenTabs.vue"
import SavedTabs from "src/components/SavedTabs.vue"
import {useNotificationsStore} from "stores/notificationsStore";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useRouter} from "vue-router";

const router = useRouter()

const tab = ref('bookmarks')

watchEffect(() => {
  tab.value = useNotificationsStore().showOpenTabs ? 'openTabs' : 'bookmarks'
})

const openSavedTab = () => {
  IndexedDbPersistenceService.getMHtml("aHR0cHM6Ly9jc3NncmFkaWVudC5pby8=")
}

const openSavedTabInline = () => {
  router.push("/mhtml/aHR0cHM6Ly9jc3NncmFkaWVudC5pby8=")

}

</script>
