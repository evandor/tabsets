<template>
  <div>
    <q-form @submit.prevent="submit()" ref="theForm">
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">Add Folder</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body">Name:</div>
          <q-input
            v-model="newFolderName"
            class="q-mb-md q-pb-none"
            dense
            autofocus
            @update:model-value="(val: string | number | null) => checkIsValid()"
            :rules="[
              (val: string) => (val.trim() !== '.' && val.trim() !== '..') || 'This is a reserved name',
              (val: string) => Tabset.newTabsetNameIsValid(val) || 'Please do not use special Characters',
              (val: string) => Tabset.newTabsetNameIsShortEnough(val) || 'the maximum length is 32',
              (val: string) => doesNotExistYet(val) || 'Folder already exists...',
            ]">
            <template v-slot:hint>
              <span class="text-negative"></span>
            </template>
          </q-input>

          <template v-if="inBexMode()">
            <q-checkbox data-testid="newTabsetAutoAdd" v-model="addAllOpenTabs">
              <slot><span>Add all open tabs</span></slot>
            </q-checkbox>
            &nbsp;
            <q-icon name="sym_o_help" color="primary" size="1em">
              <q-tooltip class="tooltip-small"
                >If you select this option, all currently open tabs will be added to the new folder</q-tooltip
              >
            </q-icon>
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <DialogButton label="Cancel" />
          <DialogButton label="Add" type="submit" :disable="!isValid" :default-action="true" />
        </q-card-actions>
      </q-card>
    </q-form>
  </div>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { QForm, uid, useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref, watchEffect } from 'vue'

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const { inBexMode } = useUtils()

const props = defineProps({
  name: { type: String, default: '' },
  tabsetId: { type: String, required: true },
  parentFolder: { type: String, required: false },
})

const newFolderName = ref(props.name)
const isValid = ref(false)
const addAllOpenTabs = ref(false)
const theForm = ref<QForm>(null as unknown as QForm)
const openTabsCount = ref(0)

watchEffect(() => {
  openTabsCount.value = useTabsStore2().browserTabs.length
})

const checkIsValid = () => {
  if (theForm.value) {
    theForm.value.validate().then((res) => {
      isValid.value = res
    })
  }
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
  let tabsToUse = addAllOpenTabs.value ? useTabsStore2().browserTabs : []
  useCommandExecutor().executeFromUi(
    new CreateFolderCommand(
      uid(),
      newFolderName.value,
      _.map(tabsToUse, (t: chrome.tabs.Tab) => new Tab(uid(), t)),
      props.tabsetId,
      props.parentFolder,
    ),
  )
}
</script>
