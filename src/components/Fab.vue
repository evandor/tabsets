<template>
  <q-page-sticky position="bottom-right" :offset="[80, 60]">
    <q-fab
      :class="{
        'heartBeat animated': useNotificationsStore().fabHasElementAnimation,
        'rotateIn animated': useNotificationsStore().fabHasElementAnimation
      }"
      icon="more_horiz"
      direction="up"
      color="primary">
      <q-fab-action @click="showNewTabsetDialog = true" style="width:170px" color="primary" icon="tabs"
                    label="New Tabset">
        <q-tooltip>Start a new tabset by assigning your open tabs</q-tooltip>
      </q-fab-action>
      <q-fab-action v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"
                    @click="showNewUrlDialog = true" style="width:170px" color="primary" icon="link" label="Add Url">
        <q-tooltip>Add a Url to the current tabset manually '{{ tabsStore.currentTabsetId }}'</q-tooltip>
      </q-fab-action>
      <q-fab-action
                    @click="useNotificationsStore().showBookmarks = !useNotificationsStore().showBookmarks"
                    style="width:170px" color="primary"
                    :icon="useNotificationsStore().showBookmarks ? 'visibility_off' : 'visibility'"
                    :label="useNotificationsStore().showBookmarks ? 'Hide Bookmarks' : 'Show Bookmarks'">
        <q-tooltip>Add a Url to the current tabset manually '{{ tabsStore.currentTabsetId }}'</q-tooltip>
      </q-fab-action>
      <q-fab-action
        v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"
        @click="showReindexDialog = true"
        style="width:200px" color="warning" icon="database" label="Re-Index Tabset...">
        <q-tooltip>If you are not happy with the search result, you can try to re-index this tabset.</q-tooltip>
      </q-fab-action>
    </q-fab>
  </q-page-sticky>

  <q-dialog v-model="showNewUrlDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Add Url to current tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide the url to be added</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">Url:</div>
        <q-input dense v-model="url" autofocus @keyup.enter="prompt = false"/>
        <div class="text-body2 text-warning">{{ newUrlDialogWarning() }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup/>
        <q-btn flat label="Add URL"
               :disable="url.trim().length === 0" v-close-popup
               @click="createNewUrl()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup lang="ts">

import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useTabsStore} from "src/stores/tabsStore";
import {uid, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {Tab} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {useNotificationsStore} from "src/stores/notificationsStore"
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue"
import ReindexDialog from "components/dialogues/ReindexDialog.vue";

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const url = ref('')
const showNewTabsetDialog = ref(false)
const showNewUrlDialog = ref(false)
const showReindexDialog = ref(false)

watchEffect(() => {
  if (showNewTabsetDialog.value) {
    $q.dialog({
      component: NewTabsetDialog
    }).onDismiss(() => {
      showNewTabsetDialog.value = false
    })
  }
})

watchEffect(() => {
  if (showReindexDialog.value) {
    $q.dialog({
      component: ReindexDialog,
      componentProps: {
        tabsetId: tabsStore.currentTabsetId,
      }
    }).onDismiss(() => {
      showReindexDialog.value = false
    })
  }
})

const createNewUrl = () => {
  console.log("new url", url.value)
  const tab = new Tab(uid(), null as unknown as chrome.tabs.Tab)
  tab.created = new Date().getTime()
  tab.chromeTab = ChromeApi.createChromeTabObject(url.value, url.value, null as unknown as string)
  TabsetService.saveToCurrentTabset(tab)
}

const newUrlDialogWarning = () => {
  try {
    new URL(url.value)
    return ''
  } catch (err) {
    return 'not a proper URL'
  }
}



</script>
