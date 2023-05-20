<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{props.firstTabset ? 'Create your first Tabset':'Create a new Tabset'}}</div>
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
                    v-model="addAllOpenTabs" label="Add all open tabs"/>&nbsp;
        <q-icon v-if="props.firstTabset === false"
                name="help" color="primary" size="1em">
          <q-tooltip>If you select this option, all currently open tabs will be added to your new tabset</q-tooltip>
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
import {TabsetStatus} from "src/models/Tabset";
import {useSpacesStore} from "src/stores/spacesStore";
import spacesService from "src/services/SpacesService";
import ChromeApi from "src/services/ChromeApi";

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
  },
  fromPanel: {
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
// const addEmptyTabset = ref(props.firstTabset ? false : (tabsStore.tabs.length <= 1 ? false : props.setEmptyByDefault))
const addAllOpenTabs = ref(false)

const newTabsetNameIsValid = computed(() => newTabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(newTabsetName.value))

const firstTabset = [
  ChromeApi.createChromeTabObject("Welcome to Tabsets", "https://tabsets.web.app/#/welcome", "")
]

watchEffect(() => {
  const existsInTabset = tabsStore.existingInTabset(newTabsetName.value)
  newTabsetNameExists.value = !!existsInTabset && existsInTabset.status !== TabsetStatus.DELETED
})

const createNewTabset = () => {
  hideWarning.value = true
  const tabsToUse = addAllOpenTabs.value ? tabsStore.tabs : []

  useCommandExecutor()
    .executeFromUi(new CreateTabsetCommand(newTabsetName.value, props.firstTabset ? firstTabset : tabsToUse))
    .then((res) => {
      //useUiStore().setNewTabsetEmptyByDefault(addEmptyTabset.value)
      if (!addAllOpenTabs.value) {
        TabsetService.createPendingFromBrowserTabs()
      } else {
        if (tabsStore.pendingTabset) {
          // clear pending tabset - why neccessary?
          tabsStore.pendingTabset.tabs = []
        }
      }
      if (!props.fromPanel) {
        router.push("/tabsets/" + res.result.tabsetId + "?first=" + props.firstTabset)
      }
    })
}

const newTabsetDialogWarning = () => {
  const currentSpace = useSpacesStore().space
  const existsInTabset = tabsStore.existingInTabset(newTabsetName.value, currentSpace)
  return (!hideWarning.value && existsInTabset && existsInTabset.status !== TabsetStatus.DELETED) ?
    "Hint: Tabset exists, but you can add tabs" : ""
}


</script>
