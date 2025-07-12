<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Backup and close tabs</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          If you click on 'Backup and close tabs', all tabs which are already contained in a tabset will be closed, and
          all the others will be moved to the dedicated 'backup' tabset.
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn flat label="Backup and close tabs" v-close-popup @click="backupAndCloseTabs()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { uid, useDialogPluginComponent } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

async function closeTrackedTabs(): Promise<chrome.tabs.Tab[]> {
  // TODO long-Running action
  const currentTab = await BrowserApi.getCurrentTab()

  const result: chrome.tabs.Tab[] = await chrome.tabs.query({})
  const tabsToClose: chrome.tabs.Tab[] = []
  const tabsToKeep: chrome.tabs.Tab[] = []
  _.forEach(result, (tab: chrome.tabs.Tab) => {
    if (tab && tab.url && tab.url !== currentTab.url && useTabsetService().tabsetsFor(tab.url).length > 0) {
      tabsToClose.push(tab)
    } else {
      tabsToKeep.push(tab)
    }
  })
  // console.log("tabsToClose", tabsToClose)
  _.forEach(tabsToClose, (t: chrome.tabs.Tab) => {
    if (t.id) {
      chrome.tabs.remove(t.id)
    }
  })
  return Promise.resolve(tabsToKeep)
}

const backupAndCloseTabs = () => {
  closeTrackedTabs().then((tabsToBackup: chrome.tabs.Tab[]) => {
    const backupTabset = useTabsetsStore().getTabset('BACKUP')
    if (backupTabset) {
      tabsToBackup.forEach((t) => {
        const tab = new Tab(uid(), t)
        useTabsetService().addToTabset(backupTabset, tab)
      })
    }
  })
  // .then(() => TabsetService.closeAllTabs())
}
</script>
