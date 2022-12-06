<template>

  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline" v-text="drawerLabel()"></div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <q-tabs
    v-model="tab"
    dense
    class="text-primary q-mt-none greyBorderTop">
    <q-tab name="bookmarks" icon="o_bookmark" color="positive">
      <q-tooltip>Your bookmarks</q-tooltip>
    </q-tab>
    <q-tab name="openTabs" icon="o_table_rows">
      <q-tooltip>Your open tabs</q-tooltip>
    </q-tab>
    <q-tab name="savedTabs" icon="o_save">
      <q-tooltip>Your saved tabs</q-tooltip>
    </q-tab>
    <q-tab name="tabset" icon="o_tab" v-if="featureToggles.isEnabled('sidebar')">
      <q-tooltip>Your current tabset</q-tooltip>
    </q-tab>
  </q-tabs>

  <BookmarksTree v-if="tab === 'bookmarks'"/>

  <OpenTabs v-else-if="tab === 'openTabs'"/>

  <SavedTabs v-else-if="tab === 'savedTabs'"/>

  <TabsetAsSidebar v-else/>

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
import TabsetAsSidebar from "src/components/TabsetAsSidebar.vue"
import {useNotificationsStore} from "stores/notificationsStore";
import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";

const router = useRouter()

const featureToggles = useFeatureTogglesStore()

const tab = ref('bookmarks')

watchEffect(() => {
  tab.value = useNotificationsStore().showOpenTabs ? 'openTabs' : 'bookmarks'
})

const drawerLabel = () => {
  switch (tab.value) {
    case "bookmarks":
      return "Bookmarks"
    case "openTabs":
      return "Open Tabs"
    case "savedTabs":
      return "Saved Pages"
    case "tabset":
      return "Tabset Sidebar"
    default:
      return tab.value
  }
}
</script>

<style lang="sass" scoped>
.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey
</style>
