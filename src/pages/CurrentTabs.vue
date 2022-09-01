<template>
  <q-page padding>
    contextId: {{tabsStore.contextId}}, Current TabsetId {{tabsStore.currentTabsetId}}
    <div v-if="tabsStore.contextId && tabsStore.currentTabsetId===tabsStore.contextId">
      <!-- "D" in overview.excalidraw -->
      <div>Context</div>
      <context-component></context-component>
    </div>
    <div class="text-body1" v-else-if="tabsStore.contextId && tabsStore.currentTabsetId==='current'">
      <div>chrome</div>
      <chrome-tabset></chrome-tabset>
    </div>
    <div v-else-if="tabsStore.contextId && tabsStore.currentTabsetId!==tabsStore.contextId">
      <div>Edit 1</div>
      <edit-tabset-component></edit-tabset-component>
    </div>
    <div class="text-body1" v-else-if="!tabsStore.contextId && tabsStore.currentTabsetId!=='current'">
      <!-- "B" in overview.excalidraw -->
      <div>Edit 2</div>
      <edit-tabset-component></edit-tabset-component>
    </div>

    <div class="text-body1" v-else-if="!tabsStore.contextId && tabsStore.currentTabsetId==='current'">
      <div>chrome</div>
      <chrome-tabset></chrome-tabset>
    </div>
    <div v-else>
      <div>ELSE</div>
      {{tabsStore.contextId}}--{{tabsStore.currentTabsetId}}???
    </div>

  </q-page>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "stores/tabsStore";
import {useTabGroupsStore} from "stores/tabGroupsStore";
import TabsetService from "src/services/TabsetService";
import {Tab, TabStatus} from "src/models/Tab";
import ContextComponent from "src/components/ContextComponent.vue"
import EditTabsetComponent from "components/EditTabsetComponent.vue";
import ChromeTabset from "components/ChromeTabset.vue";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const tabsetname = ref(tabsStore.currentTabsetName)
const $q = useQuasar()

watchEffect(() => {
  //console.log("context changed", tabsStore.contextId)
  //console.log("tabset changed", tabsStore.contextId)
})

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
    router.push("/")
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
