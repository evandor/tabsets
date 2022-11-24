<template>
  <q-page-sticky position="bottom-right" :offset="[80, 60]">
    <q-fab
      data-testid="fab_widget"
      :class="{
        'heartBeat animated': useNotificationsStore().fabHasElementAnimation,
        'rotateIn animated': useNotificationsStore().fabHasElementAnimation
      }"
      icon="more_horiz"
      direction="up"
      color="accent">

      <q-fab-action v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"
                    data-testid="fab_add_url"
                    @click="showNewUrlDialog = true"
                    style="width:190px" color="accent"
                    icon="link"
                    label="Add Url">
        <q-tooltip>Add a Url to the current tabset manually '{{ tabsStore.currentTabsetId }}'</q-tooltip>
      </q-fab-action>

      <q-fab-action v-if="featureToggles.isEnabled('spaces') && tabsStore.getCurrentTabs.length > 0"
                    @click="newSpaceDialog = true"
                    style="width:190px" color="accent"
                    icon="workspaces"
                    label="Create a new Space">
        <q-tooltip>Create a new Space to organize your tabsets</q-tooltip>
      </q-fab-action>

      <q-fab-action v-if="tabsStore.tabs.length > 1"
                    @click="closeTrackedTabs"
                    style="width:190px" color="accent"
                    icon="close"
                    label="Close all tracked tabs">
        <q-tooltip>All tabs which are stored in some tabset will be closed.</q-tooltip>
      </q-fab-action>

      <q-fab-action v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId)"
                    @click="showReindexDialog = true"
                    style="width:190px" color="accent"
                    icon="database"
                    label="Re-Index Tabset...">
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
        <q-input dense v-model="url"
                 data-testid="fab_add_url_input"
                 autofocus @keyup.enter="prompt = false"/>
        <div class="text-body2 text-warning">{{ newUrlDialogWarning() }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup/>
        <q-btn flat label="Add URL"
               data-testid="fab_add_url_submit"
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
import NewSpaceDialog from "components/dialogues/NewSpaceDialog.vue";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";

const tabsStore = useTabsStore()
const featureToggles = useFeatureTogglesStore()

const router = useRouter()
const $q = useQuasar()

const url = ref('')
const showNewTabsetDialog = ref(false)
const showNewUrlDialog = ref(false)
const showReindexDialog = ref(false)
const newSpaceDialog = ref(false)

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

watchEffect(() => {
  if (newSpaceDialog.value) {
    $q.dialog({
      component: NewSpaceDialog,
      componentProps: {
        tabsetId: tabsStore.currentTabsetId,
      }
    }).onDismiss(() => {
      newSpaceDialog.value = false
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

const closeTrackedTabs = () => TabsetService.closeTrackedTabs()


</script>
