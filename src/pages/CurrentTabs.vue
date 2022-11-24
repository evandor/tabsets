<template>
  <q-page padding>

    <div v-if="layout === 'list'">
      <tabset-list></tabset-list>
    </div>
    <div v-else-if="layout === 'thumbnails'">
      <tabset-thumbnails></tabset-thumbnails>
    </div>
    <div v-else>
      <edit-tabset-component></edit-tabset-component>
    </div>

    <fab></fab>


  </q-page>


</template>

<script setup lang="ts">
import {ref} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import EditTabsetComponent from "components/EditTabsetComponent.vue";
import Fab from "components/Fab.vue";
import TabsetList from "components/TabsetList.vue";
import TabsetThumbnails from "components/TabsetThumbnails.vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()

const $q = useQuasar()

const layout = ref('grid')

const layoutFromStorage = localStorage.getItem("layout")
if (layoutFromStorage) {
  layout.value = layoutFromStorage.toString()
}
//
// const selectedTabsetFromStorage = localStorage.getItem("selectedTabset") as unknown as string
// if (selectedTabsetFromStorage) {
//   console.log("selecting tabset from storage")
//   TabsetService.selectTabset(selectedTabsetFromStorage)
// }

//
// function unpinnedNoGroup() {
//   return _.filter(
//     _.map(tabsStore.getCurrentTabs, t => t),
//     (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1)
// }
//
// function tabsForGroup(groupId: number) {
//   console.log("tabsforGroup", groupId)
//   return _.filter(
//     _.map(tabsStore.getCurrentTabs, t => t.chromeTab || t),
//     (t: any) => t.groupId === groupId)
// }
//
// const tabsetOptions = () => {
//   return _.map([...tabsStore.tabsets.values()], ts => {
//     return {
//       label: ts.name,
//       value: ts.id
//     }
//   })
// }
//
// const formatLength = (length: number, singular: string, plural: string) => {
//   return length > 1 ? length + ' ' + plural : length + ' ' + singular
// }

//
// const deleteDialog = () => {
//   $q.dialog({
//     title: 'Deleting Tabset',
//     message: 'Would you like to delete this tabset?',
//     cancel: true,
//     persistent: true
//   }).onOk(() => {
//     TabsetService.delete(tabsStore.currentTabsetId)
//     router.push("/tabset")
//   }).onCancel(() => {
//   }).onDismiss(() => {
//   })
// }

// const restoreDialog = () => {
//   $q.dialog({
//     title: 'Restore Tabset',
//     message: 'Would you like to restore this tabset? All current tabs will be closed before.',
//     cancel: true,
//     persistent: true
//   }).onOk(() => {
//     TabsetService.restore(tabsStore.currentTabsetId)
//   }).onCancel(() => {
//   }).onDismiss(() => {
//   })
//
//
// }

</script>
