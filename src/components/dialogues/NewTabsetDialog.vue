<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Create a new Tabset</div>
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
        <q-checkbox v-if="props.firstTabset === false"
                    data-testid="newTabsetAutoAdd"
                    v-model="addEmptyTabset" label="Create an empty tabset"/>&nbsp;
        <q-icon v-if="props.firstTabset === false"
                name="help" color="primary" size="1em">
          <q-tooltip>Otherwise, all open tabs will be added to your new tabset automatically</q-tooltip>
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
import {useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import TabsetService from "src/services/TabsetService";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useUiStore} from "src/stores/uiStore";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  setEmptyByDefault: {
    type: Boolean,
    default: false
  },
  firstTabset: {
    type: Boolean,
    default: false
  }
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const tabsStore = useTabsStore()
const router = useRouter()
const $q = useQuasar()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)
const hideWarning = ref(false)
const addEmptyTabset = ref(props.firstTabset ? false : (tabsStore.tabs.length <= 1 ? false : props.setEmptyByDefault))

const newTabsetNameIsValid = computed(() => newTabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value))

watchEffect(() => {
  newTabsetNameExists.value = !!tabsStore.nameExistsInContextTabset(newTabsetName.value);
})

const createNewTabset = () => {
  hideWarning.value = true
  const tabsToUse = addEmptyTabset.value ? [] : tabsStore.tabs

  useCommandExecutor()
    .executeFromUi(new CreateTabsetCommand(newTabsetName.value, tabsToUse))
    .then((res) => {
      useUiStore().setNewTabsetEmptyByDefault(addEmptyTabset.value)
      if (addEmptyTabset.value) {
        TabsetService.createPendingFromBrowserTabs()
      } else {
        if (tabsStore.pendingTabset) {
          // clear pending tabset - why neccessary?
          tabsStore.pendingTabset.tabs = []
        }
      }
      router.push("/tabsets/" + res.result.tabsetId + "?first=" + props.firstTabset)
    })
}

const newTabsetDialogWarning = () => {
  return (!hideWarning.value && tabsStore.nameExistsInContextTabset(newTabsetName.value)) ?
    "Hint: Tabset exists, but you can add tabs" : ""
}


</script>
