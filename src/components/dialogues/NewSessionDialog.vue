<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6" v-if="props.replaceSession">Replace existing Session</div>
        <div class="text-h6" v-else>Start a new Session</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Please provide a name for the new Session or keep the suggested name.<br><br>A session is
          a special tabset
          which will keep track of your tabs automatically as long it is active.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body">New Session's name:</div>
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
          <q-tooltip>When checked, this will add all your browsers open tabs automatically to the new Session.<br>
          </q-tooltip>
        </q-icon>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat
               data-testid="newTabsetNameSubmit"
               :label="newTabsetNameExists ? 'Alter Session' : 'Create new Session'"
               :disable="newTabsetName.trim().length === 0" v-close-popup
               @click="createNewTabset()"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {CreateSessionCommand} from "src/domain/commands/CreateSession";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";

defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  setEmptyByDefault: {type: Boolean, default: false},
  replaceSession: {type: Boolean, default: false},
  inSidePanel: {type: Boolean, default: false}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const router = useRouter()

const newTabsetName = ref('Session ' + new Date().getDate() + '.' + (new Date().getMonth() + 1))
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)
const addAutomatically = ref(props.setEmptyByDefault)

const newTabsetNameIsValid = computed(() => newTabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value))

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value);
})

const createNewTabset = () => {
  hideWarning.value = true
  const tabsToUse = addAutomatically.value ? useTabsStore2().browserTabs : []

  useCommandExecutor()
    .executeFromUi(new CreateSessionCommand(newTabsetName.value, tabsToUse))
    .then((res) => {
      // if (!addAutomatically.value) {
      //   TabsetService.createPendingFromBrowserTabs()
      // } else {
      //   // clear pending tabset - why neccessary?
      //   // tabsStore.pendingTabset.tabs = []
      // }
      // router.push("/tabsets" + useTabsStore().currentTabsetId)
      if (!props.inSidePanel) {
        router.push("/tabsets/" + res.result.tabsetId )
      } else {
        router.push("/sidepanel")
      }
    })
}

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && useTabsetsStore().existingInTabset(newTabsetName.value)) ?
    "Hint: Tabset exists, but you can change it into a session" : ""
}


</script>
