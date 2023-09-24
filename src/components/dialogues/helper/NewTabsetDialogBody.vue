<template>
  <div>
    <q-form @submit.prevent="createNewTabset()" ref="theForm">

      <q-card class="q-dialog-plugin" style="max-width:100%">
        <q-card-section>
          <div class="text-h6">Add Tabset</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body">Name:</div>
          <q-input v-model="newTabsetName"
                   class="q-mb-md q-pb-none"
                   dense autofocus
                   @update:model-value="val => checkIsValid()"
                   :rules="[
                       val => Tabset.newTabsetNameIsValid(val) || 'Please do not use special Characters',
                       val => Tabset.newTabsetNameIsShortEnough(val) || 'the maximum length is 32',
                       val => doesNotExistYet(val) || 'Tabset already exists'
                       ]"
                   data-testid="newTabsetName"/>

          <template v-if="inBexMode()">
            <q-checkbox
                data-testid="newTabsetAutoAdd"
                v-model="addAllOpenTabs" label="Add all open tabs"/>&nbsp;
            <q-icon
                name="help" color="primary" size="1em">
              <q-tooltip>If you select this option, all currently open tabs will be added to your new tabset</q-tooltip>
            </q-icon>
          </template>
        </q-card-section>

        <q-card-section v-if="usePermissionsStore().hasFeature(FeatureIdent.WINDOW_MANAGEMENT)">
          <q-select
              dense
              options-dense
              label="Open in Window"
              filled
              v-model="windowModel"
              map-options
              use-input
              :options="windowOptions"
              input-debounce="0"
              new-value-mode="add"
              @new-value="createWindowOption"
              :rules="[
                       val => Tabset.newTabsetNameIsValid(val) || 'Please do not use special Characters',
                       val => Tabset.newTabsetNameIsShortEnough(val) || 'the maximum length is 32'
                       ]"
          />
        </q-card-section>

        <q-card-section v-if="usePermissionsStore().hasFeature(FeatureIdent.COLOR_TAGS)">
          Assign Color (optional)
          <div class="row q-pa-xs q-mt-none q-pl-sm q-gutter-sm">
            <ColorSelector @colorSet="(color:string) => theColor = color"/>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Cancel" size="sm" color="accent" v-close-popup/>
          <q-btn type="submit" size="sm" color="warning"
                 data-testid="newTabsetNameSubmit"
                 :disable="!isValid"
                 label="Add"
                 v-close-popup/>
        </q-card-actions>

      </q-card>
    </q-form>
  </div>
</template>

<script lang="ts" setup>

import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import {QForm, uid, useDialogPluginComponent, useQuasar} from "quasar";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {ref, watchEffect} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabsetCommand} from "src/domain/tabsets/CreateTabset";
import {useTabsetService} from "src/services/TabsetService2";
import TabsetService from "src/services/TabsetService";
import {SidePanelView, useUiStore} from "stores/uiStore";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useWindowsStore} from "stores/windowsStores";
import {useUtils} from "src/services/Utils";
import ColorSelector from "components/dialogues/helper/ColorSelector.vue";

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()
const {inBexMode} = useUtils()

const props = defineProps({
  spaceId: {type: String, required: false},
  fromPanel: {type: Boolean, default: false}
})

const tabsStore = useTabsStore()
const router = useRouter()

const newTabsetName = ref('')
const isValid = ref(false)
const addAllOpenTabs = ref(false)
const theForm = ref<QForm>(null as unknown as QForm)
const windowModel = ref<string>('current')
const windowOptions = ref<string[]>([])
const theColor = ref<string | undefined>(undefined)

watchEffect(() => {
  const windows: Set<string> = useWindowsStore().windowSet
  windowOptions.value = []
  windowOptions.value.push('current')
  const sortedWindowNames = Array.from(windows).sort();
  sortedWindowNames.forEach(windowName => {
    if (windowName !== "current") {
      windowOptions.value.push(windowName)
    }
  })
})

const checkIsValid = () => {
  if (theForm.value) {
    theForm.value.validate()
        .then((res) => {
          isValid.value = res
        })
  }
}

const doesNotExistYet = (val: string) => {
  const existsInTabset = tabsStore.existingInTabset(val)
  return !(existsInTabset && existsInTabset.status !== TabsetStatus.DELETED)
}

const createNewTabset = () => {
  console.log("createNewTabset", addAllOpenTabs.value, tabsStore.tabs, windowModel.value)
  const tabsToUse = addAllOpenTabs.value ? tabsStore.tabs : []
  useCommandExecutor()
      .executeFromUi(new CreateTabsetCommand(newTabsetName.value, tabsToUse, windowModel.value, theColor.value))
      .then((res) => {
        if (props.spaceId) {
          const ts: Tabset = res.result.tabset
          ts.spaces.push(props.spaceId)
          useTabsetService().saveTabset(ts)
        }
        if (!addAllOpenTabs.value) {
          TabsetService.createPendingFromBrowserTabs()
        } else {
          if (tabsStore.pendingTabset) {
            // clear pending tabset - why necessary?
            tabsStore.pendingTabset.tabs = []
          }
        }
        if (!props.fromPanel) {
          router.push("/tabsets/" + res.result.tabsetId)
        } else {
          useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)
          router.push("/sidepanel?first=")
        }
      })
}

const createWindowOption = (val: any, done: any) => {
  const sanitized = val.replace(STRIP_CHARS_IN_USER_INPUT, '')
  windowOptions.value.push(sanitized)
  done(sanitized, 'add-unique')
}

</script>
