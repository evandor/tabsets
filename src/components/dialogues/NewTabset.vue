<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Save open Tabs as Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide a name for the new tabset</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">New Tabset's name:</div>
        <q-input dense v-model="newTabsetName" autofocus @keydown.enter="createNewTabset()" v-close-popup/>
        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat :label="newTabsetNameExists ? 'Alter Tabset' : 'Create new Tabset'"
               :disable="newTabsetName.trim().length === 0" v-close-popup
               @click="createNewTabset()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!tabsStore.nameExistsInContextTabset(newTabsetName.value);
})

const createNewTabset = () => {
  hideWarning.value = true
  TabsetService.saveOrReplaceFromChromeTabs(newTabsetName.value, [], true)
    .then((result: object) => {
      // populate pending set
      TabsetService.createPendingFromBrowserTabs()

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
    "Tabset already exists" : ""
}


</script>
