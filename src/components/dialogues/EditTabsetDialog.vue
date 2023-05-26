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
        <q-input dense v-model="newTabsetName" autofocus @keydown.enter="updateTabset()"
                 error-message="Please do not use special Characters, maximum length is 32"
                 :error="!newTabsetNameIsValid"
        />
        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Rename Tabset"
               :disable="newTabsetName?.trim().length === 0 || newTabsetName?.trim() === props.tabsetName || newTabsetDialogWarning() !== ''"
               v-close-popup
               @click="updateTabset()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";

import {useDialogPluginComponent} from 'quasar'
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {RenameTabsetCommand} from "src/domain/tabsets/RenameTabset";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";

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
  },
  fromPanel: {
    type: Boolean,
    default: false
  }
})

const {handleError, handleSuccess} = useNotificationHandler()
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

const updateTabset = () =>
  useCommandExecutor().executeFromUi(new RenameTabsetCommand(props.tabsetId, newTabsetName.value))

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && newTabsetName.value !== props.tabsetName && tabsStore.nameExistsInContextTabset(newTabsetName.value)) ?
    "Tabset already exists" : ""
}

const newTabsetNameIsValid = computed(() => newTabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value))


</script>
