<template>
  <div>
    <q-form @submit.prevent="submit()" ref="theForm">
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6" v-if="props.windowId">Save Windows Tabs as Tabset</div>
          <div class="text-h6" v-else>Add Tabset Collection</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body">Name:</div>
          <q-input
            v-model="newTabsetName"
            class="q-mb-md q-pb-none"
            dense
            autofocus
            @update:model-value="(val: string | number | null) => checkIsValid()"
            :rules="[
              (val: string) => Tabset.newTabsetNameIsValid(val) || 'Please do not use special Characters',
              (val: string) => Tabset.newTabsetNameIsShortEnough(val) || 'the maximum length is 32',
              (val: string) => doesNotExistYet(val) || 'Tabset already exists...',
            ]"
            data-testid="newTabsetName">
            <template v-slot:hint>
              <span class="text-negative">{{
                isNotArchived(newTabsetName) ? '' : 'Tabset already exists and is archived'
              }}</span>
            </template>
          </q-input>

          <template v-if="inBexMode() && !props.windowId">
            <q-checkbox
              :style="isNotArchived(newTabsetName) ? '' : 'opacity: 0.2'"
              :disable="!isNotArchived(newTabsetName)"
              data-testid="newTabsetAutoAdd"
              v-model="addAllOpenTabs">
              <slot><span :style="isNotArchived(newTabsetName) ? '' : 'opacity: 0.2'">Add all open tabs</span></slot>
            </q-checkbox>
            &nbsp;
            <q-icon v-if="!props.windowId" name="sym_o_help" color="primary" size="1em">
              <q-tooltip class="tooltip-small"
                >If you select this option, all currently open tabs will be added to your new Collection</q-tooltip
              >
            </q-icon>
          </template>
        </q-card-section>

        <!--        <q-card-section v-if="!props.windowId" :style="isNotArchived(newTabsetName) ? '' : 'opacity: 0.2'">-->
        <!--          <q-select-->
        <!--            dense-->
        <!--            options-dense-->
        <!--            clearable-->
        <!--            clear-icon="close"-->
        <!--            label="Open in Window"-->
        <!--            filled-->
        <!--            v-model="windowModel"-->
        <!--            map-options-->
        <!--            use-input-->
        <!--            :options="windowOptions"-->
        <!--            input-debounce="0"-->
        <!--            @new-value="createWindowOption"-->
        <!--            :disable="!isNotArchived(newTabsetName)" />-->
        <!--        </q-card-section>-->

        <q-card-section
          v-if="useFeaturesStore().hasFeature(FeatureIdent.COLOR_TAGS)"
          :style="isNotArchived(newTabsetName) ? '' : 'opacity: 0.2'">
          Assign Color (optional)
          <div class="row q-pa-xs q-mt-none q-pl-sm q-gutter-sm">
            <ColorSelector @colorSet="(color: string) => (theColor = color)" />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <DialogButton label="Cancel" />
          <DialogButton
            :label="isNotArchived(newTabsetName) ? 'Add' : 'Restore Tabset'"
            type="submit"
            data-testid="newTabsetNameSubmit"
            :disable="!isValid"
            :default-action="true" />
        </q-card-actions>
      </q-card>
    </q-form>
  </div>
</template>

<script lang="ts" setup>
import { EventBus, QForm, useDialogPluginComponent } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import ColorSelector from 'src/core/dialog/ColorSelector.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { MarkTabsetAsDefaultCommand } from 'src/tabsets/commands/MarkTabsetAsDefault'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { inject, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const { inBexMode } = useUtils()

const bus = inject('bus') as EventBus

const props = defineProps({
  spaceId: { type: String, required: false },
  name: { type: String, default: '' },
  windowId: { type: Number, required: false },
  fromPanel: { type: Boolean, default: false },
})

const tabsStore2 = useTabsStore2()
const router = useRouter()

const newTabsetName = ref(props.name)
const isValid = ref(false)
const addAllOpenTabs = ref(props.windowId !== undefined)
const theForm = ref<QForm>(null as unknown as QForm)
const windowModel = ref<string>(null as unknown as string)
const windowOptions = ref<string[]>([])
const theColor = ref<string | undefined>(undefined)
const windowsStore = useWindowsStore()
const openTabsCount = ref(0)

watchEffect(() => {
  openTabsCount.value = useTabsStore2().browserTabs.length
})

watchEffect(() => {
  const windows: Set<string> = useWindowsStore().windowSet
  windowOptions.value = []
  windowOptions.value.push('current')
  const sortedWindowNames = Array.from(windows).sort()
  sortedWindowNames.forEach((windowName) => {
    if (windowName !== 'current') {
      windowOptions.value.push(windowName)
    }
  })
})

const checkIsValid = () => {
  if (theForm.value) {
    theForm.value.validate().then((res) => {
      isValid.value = res
    })
  }
}

const isNotArchived = (val: string) => {
  const existsInTabset = useTabsetsStore().existingInTabset(val)
  return !(existsInTabset && existsInTabset.status === TabsetStatus.ARCHIVED)
}

const doesNotExistYet = (val: string) => {
  const existsInTabset = useTabsetsStore().existingInTabset(val)
  return !(
    existsInTabset &&
    existsInTabset.status !== TabsetStatus.DELETED &&
    existsInTabset.status !== TabsetStatus.ARCHIVED
  )
}

const submit = () => {
  //console.log("submit", addAllOpenTabs.value, tabsStore2.browserTabs, windowModel.value)
  const existsInTabset = useTabsetsStore().existingInTabset(newTabsetName.value)
  if (existsInTabset && existsInTabset.status === TabsetStatus.ARCHIVED) {
    unarchiveTabset()
    useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
    useTabsetService().selectTabset(existsInTabset.id)
    //router.push("/sidepanel?first=")
  } else {
    let tabsToUse = addAllOpenTabs.value ? tabsStore2.browserTabs : []
    if (props.windowId) {
      console.log('windowsStore', windowsStore)
      // TODO ignoring props.windowId !?!
      const window: chrome.windows.Window | undefined = windowsStore.currentBrowserWindow
      if (window) {
        tabsToUse = window.tabs as chrome.tabs.Tab[]
        windowModel.value = newTabsetName.value
      }
    }
    useCommandExecutor()
      .executeFromUi(
        new CreateTabsetCommand(newTabsetName.value, tabsToUse, props.spaceId, windowModel.value, theColor.value),
      )
      .then((res) => {
        //bus.emit('run-metrics')
        // if (props.spaceId) {
        //   const ts: Tabset = res.result?.tabset
        //   ts.spaces.push(props.spaceId)
        //   useTabsetService().saveTabset(ts)
        // }
        if (!props.fromPanel) {
          router.push('/sidepanel/tabsets/' + res.result?.tabsetId)
        } else {
          useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
          router.push('/sidepanel?first=')
        }
      })
  }
}

const unarchiveTabset = () => {
  const archivedTabset = useTabsetsStore().existingInTabset(newTabsetName.value)
  if (archivedTabset) {
    useCommandExecutor()
      .executeFromUi(new MarkTabsetAsDefaultCommand(archivedTabset.id))
      .then((res) => {
        // sendMsg('reload-tabset', {tabsetId: tabset.id})
      })
  }
}
</script>
