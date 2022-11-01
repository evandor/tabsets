<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Index your Tabsets</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">If your search does not yield the results you'd expect, you can try re-indexing your tabsets.</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">
          Reindexing is the process of going through all your tabsets (and tabs), analyze the tabs' contents and create
          new thumbnail screenshots. For this, <b>a new browser window is opened and the tabs are analyzed one by one</b>.
          Given your current data, this will take about {{ duration }} minutes.<br><br>
          <span class="text-negative">Please do not use your computer otherwise in that time as it will break the results.</span>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat
               data-testid="reindexSubmit"
               label="Got it, start indexing"
               v-close-popup
               @click="startIndexing()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import {useSearchStore} from "stores/searchStore";

defineEmits([
  ...useDialogPluginComponent.emits
])

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const searchStore = useSearchStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)
const addAutomatically = ref(false)
const duration = ref(1)

watchEffect(() => {
  if (tabsStore) {
    duration.value = 1 + Math.floor(tabsStore.allTabsCount * 3 / 60)
  }
})


watchEffect(() => {
  newTabsetNameExists.value = !!tabsStore.nameExistsInContextTabset(newTabsetName.value);
})

const createNewTabset = () => {
  hideWarning.value = true
  const tabsToUse = addAutomatically.value ? tabsStore.tabs : []
  TabsetService.saveOrReplaceFromChromeTabs(newTabsetName.value, tabsToUse, true)
    .then((result: object) => {

      if (!addAutomatically.value) {
        TabsetService.createPendingFromBrowserTabs()
      }

      newTabsetName.value = ''

      //@ts-ignore
      const replaced = result.replaced
      //@ts-ignore
      const merged = result.merged
      let message = 'Empty Tabset ' + newTabsetName.value + ' created successfully'
      if (replaced && merged) {
        message = 'Existing Tabset ' + newTabsetName.value + ' can be updated now'
      } else if (replaced) {
        message = 'Existing Tabset ' + newTabsetName.value + ' was overwritten'
      }
      hideWarning.value = false
      router.push("/tabset")
      $q.notify({
        message: message,
        type: 'positive'
      })
    }).catch((ex: any) => {
    console.error("ex", ex)
    hideWarning.value = false
    $q.notify({
      message: 'There was a problem creating the tabset ' + newTabsetName.value,
      type: 'warning',
    })

  })
}

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && tabsStore.nameExistsInContextTabset(newTabsetName.value)) ?
    "Hint: Tabset exists, but you can add tabs" : ""
}

const startIndexing = () => {
  searchStore.reindexAll()
}


</script>
