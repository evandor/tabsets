<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide a new name for this tabset</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">Tabset's name:</div>
        <q-input dense v-model="newTabsetName" autofocus @keydown.enter="updateTabset()"/>
        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Rename Tabset"
               :disable="newTabsetName.trim().length === 0 || newTabsetName.trim() === props.tabsetName || newTabsetDialogWarning() !== ''"
               v-close-popup
               @click="updateTabset()"/>
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

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tabsetId: {
    type: String,
    required: true
  },
  tabsetName: {
    type: String,
    required: true
  }
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetName = ref(props.tabsetName)
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!tabsStore.nameExistsInContextTabset(newTabsetName.value);
})

const updateTabset = () => {
  //hideWarning.value = true
  TabsetService.rename(props.tabsetId, newTabsetName.value)
  $q.notify({
    message: 'The tabset has been renamed',
    type: 'positive'
  })
}

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && newTabsetName.value !== props.tabsetName && tabsStore.nameExistsInContextTabset(newTabsetName.value)) ?
    "Tabset already exists" : ""
}


</script>
