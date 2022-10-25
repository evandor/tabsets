<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Import Tabsets</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">All your current tabsets will be deleted!</div>
      </q-card-section>

      <q-card-section class="q-pt-none">

<!--        <q-uploader-->
<!--          url="."-->
<!--          label="skysail cms file"-->
<!--          style="max-width: 300px"-->
<!--        />-->

        <input id="json2import" type="file" />

      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Import" v-close-popup @click="importData()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()

const importData = () => {
  // @ts-ignore
  var file = document.getElementById("json2import").files[0];
  var reader = new FileReader();
  reader.onload = function(e){
    // @ts-ignore
    const json = e.target.result
    TabsetService.importData(json as unknown as string)

  }
  reader.readAsText(file);
}


</script>
