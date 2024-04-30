<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Backup and close tabs</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">If you click on 'Backup and close tabs', all tabs which are already contained in a tabset will
        be closed, and all the others will be moved to the dedicated 'backup' tabset.</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat
               label="Backup and close tabs"
               v-close-popup
               @click="backupAndCloseTabs()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref} from "vue";
import {uid, useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import {useTabsetService} from "src/services/TabsetService2";
import {Tab} from "src/tabsets/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

defineEmits([
  ...useDialogPluginComponent.emits
])

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetName = ref( 'Session ' + new Date().getDate() + '.' + (new Date().getMonth() + 1) )
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)


const backupAndCloseTabs = () => {
  TabsetService.closeTrackedTabs()
    .then((tabsToBackup:chrome.tabs.Tab[]) => {
      const backupTabset = useTabsetsStore().getTabset('BACKUP')
      if (backupTabset) {
        tabsToBackup.forEach(t => {
          const tab = new Tab(uid(), t)
          useTabsetService().addToTabset(backupTabset, tab)
        })
      }
    })
    .then(() => TabsetService.closeAllTabs())
}

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && useTabsetsStore().existingInTabset(newTabsetName.value)) ?
    "Hint: Tabset exists, but you can change it into a session" : ""
}


</script>
