<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Export your Tabsets</div>
      </q-card-section>
      <q-card-section>
        <div class="text-caption">{{ foundLabel() }}</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please choose</div>
      </q-card-section>

      <q-card-section class="q-pt-none">

        <q-radio v-model="exportAs" val="json" label="as JSON"></q-radio>
        <!--        <q-radio v-model="exportAs" val="csv" label="as CSV (not implemented yet)"></q-radio>-->
        <q-radio v-model="exportAs" val="bookmarks" label="to Bookmarks Folder"></q-radio>

      </q-card-section>

      <q-card-section class="q-pt-none text-warning" v-if="warning !== ''">
        {{ warning }}
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Export" v-close-popup @click="exportData()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";

import {useDialogPluginComponent} from 'quasar'
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeatures";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const router = useRouter()
const $q = useQuasar()

const exportAs = ref('json')
const hideWarning = ref(false)
const warning = ref('')


const props = defineProps({
  inSidePanel: {type: Boolean, default: false}
})

watchEffect(() => {
  if (exportAs.value === 'bookmarks') {
    warning.value = "Warning! This will replace the bookmarks at '/tabsets'!"
  } else {
    warning.value = ''
  }
})

const exportData = () => {
  hideWarning.value = true
  // @ts-ignore
  const appVersion = import.meta.env.PACKAGE_VERSION
  TabsetService.exportData(exportAs.value, appVersion)
    .then(() => {
      //router.push("/tabsets/" + tabsStore.currentTabsetId)
      $q.notify({
        message: 'export successful',
        type: 'positive'
      })
    }).catch((ex: any) => {
    console.error("ex", ex)
    hideWarning.value = false
    $q.notify({
      message: 'Sorry, there was a problem exporting your data',
      type: 'warning',
    })

  })
}

const foundLabel = () => {
  const spacesCount = useSpacesStore().spaces.size
  const allTabsCount = useTabsetsStore().allTabsCount
  const tabsetsCount = useTabsetsStore().tabsets.size
  if (spacesCount > 0) {
    return "Found " + allTabsCount + " tabs in " + tabsetsCount + " Tabsets and " + spacesCount + " Spaces"
  }
  return "Found " + allTabsCount + " tabs in " + tabsetsCount + " Tabsets"
}


</script>
