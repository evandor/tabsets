<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Create a new Tabset</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide a name for the new tabset</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">New Tabset's name:</div>
        <q-input v-model="newTabsetName"
                 class="q-mb-md q-pb-none"
                 dense autofocus
                 error-message="Please do not use special Characters, maximum length is 32"
                 :error="!newTabsetNameIsValid"
                 data-testid="newTabsetName"
                 @keydown.enter="createNewTabset()"/>
        <div class="text-caption text-negative q-mt-none q-pt-none">{{ newTabsetDialogWarning() }}</div>
        <q-checkbox
          data-testid="newTabsetAutoAdd"
          v-model="addAutomatically" label="Add open tabs automatically"/>&nbsp;
        <q-icon name="help" color="primary" size="1em">
          <q-tooltip>When checked, this will add all your browsers open tabs automatically to the new tabset.<br>
            Otherwise, you have the chance to add all (or selected) tabs yourself later.
          </q-tooltip>
        </q-icon>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat
               data-testid="newTabsetNameSubmit"
               :label="newTabsetNameExists ? 'Alter Tabset' : 'Create new Tabset'"
               :disable="newTabsetName.trim().length === 0" v-close-popup
               @click="createNewTabset()"/>
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
import {CreateTabsetCommand} from "src/domain/commands/CreateTabsetCommand";
import {NotificationHandler} from "src/services/NotificationHandler";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {ExecutionResult} from "src/domain/ExecutionResult";
import TabsetService from "src/services/TabsetService";

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)
const addAutomatically = ref(false)

const newTabsetNameIsValid = computed(() => newTabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value))

watchEffect(() => {
  newTabsetNameExists.value = !!tabsStore.nameExistsInContextTabset(newTabsetName.value);
})

const createNewTabset = () => {
  hideWarning.value = true
  const tabsToUse = addAutomatically.value ? tabsStore.tabs : []
  const {handleError, handleSuccess} = useNotificationHandler()

  const command = new CreateTabsetCommand(newTabsetName.value, tabsToUse)
  command.execute()
    .then((res) => {
      if (!addAutomatically.value) {
        TabsetService.createPendingFromBrowserTabs()
      }
      handleSuccess(res)
      router.push("/tabset")
    })
    .catch(err => handleError(err))
  // .catch(err => handleError())

  // TabsetService.saveOrReplaceFromChromeTabs(newTabsetName.value, tabsToUse, true)
  //   .then((result: object) => {
  //
  //
  //
  //     router.push("/tabset")
  //     $q.notify({
  //       message: message,
  //       type: 'positive'
  //     })
  //   })
  //   .catch((ex: any) => {
  //     console.error("ex", ex)
  //     hideWarning.value = false
  //     $q.notify({
  //       message: 'There was a problem creating the tabset ' + newTabsetName.value,
  //       type: 'warning',
  //     })
  //
  //   })
}

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && tabsStore.nameExistsInContextTabset(newTabsetName.value)) ?
    "Hint: Tabset exists, but you can add tabs" : ""
}


</script>
