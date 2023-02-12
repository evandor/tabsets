<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Open Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Would you like to open this tabset?</div>
      </q-card-section>

      <q-card-section>
        <div class="text-body">This means opening all the tabset's tabs in a new browser window, restoring
        the tabset you want to work with.</div>
      </q-card-section>

<!--      <q-card-section class="q-pt-none">-->

<!--        <q-radio v-model="closeOld" val="true" label="Close open Tabs"></q-radio>-->
<!--        <q-radio v-model="closeOld" val="false" label="Keep them open"></q-radio>-->

<!--      </q-card-section>-->

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Open Tabset" v-close-popup @click="openTabset()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {ref} from "vue";
import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {RestoreTabsetCommand} from "src/domain/commands/RestoreTabset"

defineEmits([
  ...useDialogPluginComponent.emits
])

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()

const closeOld = ref("false")
const warning = ref('')

const openTabset = () =>
  useCommandExecutor().execute(new RestoreTabsetCommand(tabsStore.currentTabsetId))




</script>
