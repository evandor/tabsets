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

  </q-page>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab, TabStatus} from "src/models/Tab";
import EditTabsetComponent from "components/EditTabsetComponent.vue";
import TabsetList from "components/TabsetList.vue";
import TabsetThumbnails from "components/TabsetThumbnails.vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const tabsetname = ref(tabsStore.currentTabsetName)
const $q = useQuasar()

if (tabsStore.tabsets.size < 1) {
  router.push("/about")
}

const layout = ref('grid')

const layoutFromStorage = localStorage.getItem("layout")
if (layoutFromStorage) {
  layout.value = layoutFromStorage.toString()
}

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t),
    (t: Tab) => !t.chromeTab.pinned && t.chromeTab.groupId === -1 && (t.status === TabStatus.DEFAULT || !t.status))
}

function tabsForGroup(groupId: number) {
  console.log("tabsforGroup", groupId)
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t.chromeTab || t),
    (t: any) => t.groupId === groupId)
}

const update = (tabsetIdent: object) => {
  console.log("selected tabset now: ", tabsetIdent)
  tabsetname.value = tabsetIdent['label' as keyof object]
  tabsStore.selectCurrentTabset(tabsetIdent['value' as keyof object])
}

const tabsetOptions = () => {
  return _.map([...tabsStore.tabsets.values()], ts => {
    return {
      label: ts.name,
      value: ts.id
    }
  })
}

const unsetContext = () => TabsetService.unsetContext()
const setAsContext = () => TabsetService.setContext(tabsStore.currentTabsetId)

const formatLength = (length: number, singular: string, plural: string) => {
  return length > 1 ? length + ' ' + plural : length + ' ' + singular
}



const deleteDialog = () => {
  $q.dialog({
    title: 'Deleting Tabset',
    message: 'Would you like to delete this tabset?',
    cancel: true,
    persistent: true
  }).onOk((data: any) => {
    TabsetService.delete(tabsStore.currentTabsetId)
    router.push("/tabset")
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}

const restoreDialog = () => {
  $q.dialog({
    title: 'Restore Tabset',
    message: 'Would you like to restore this tabset? All current tabs will be closed before.',
    cancel: true,
    persistent: true
  }).onOk((data: any) => {
    TabsetService.restore(tabsStore.currentTabsetId)
  }).onCancel(() => {
  }).onDismiss(() => {
  })


}

</script>
