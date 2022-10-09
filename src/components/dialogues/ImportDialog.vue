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

const exportAs = ref('json')
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)


const importData = () => {
  // @ts-ignore
  // const json = document.getElementById("json2import")
  // console.log("json", json)


  var file = document.getElementById("json2import").files[0];
  var reader = new FileReader();
  reader.onload = function(e){
    // @ts-ignore
    const json = e.target.result
    TabsetService.importData(json as unknown as string)

  }
  reader.readAsText(file);

  // TabsetService.exportData(exportAs.value)
  //   .then((result: object) => {
  //     // populate pending set
  //
  //     router.push("/tabset")
  //     $q.notify({
  //       message: 'export successful',
  //       type: 'positive'
  //     })
  //   }).catch((ex: any) => {
  //   console.error("ex", ex)
  //   hideWarning.value = false
  //   $q.notify({
  //     message: 'Sorry, there was a problem exporting your data' ,
  //     type: 'warning',
  //   })
  //
  // })
}
const uploadUrl = () => {
  return `${process.env.backendUrl}/import`
}
const additionalFields = () => {
  return [{name: 'name', value: 'imported'}, {name: 'user', value: 'auth.user.uid'}]
}


</script>
