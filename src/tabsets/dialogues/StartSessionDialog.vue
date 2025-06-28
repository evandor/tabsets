<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">Stashing</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">
            You can <b>save and hide your current tabs</b> and start with a clean browser window.
          </div>
        </q-card-section>
        <q-card-section>
          <div class="text-caption">Your current tabs will be stashed away and can be restored later.</div>
        </q-card-section>
        <q-card-section>
          <div class="text-caption">
            Clicking 'start' will close all open tabs in this window (but not the pinned ones).
          </div>
        </q-card-section>
        <q-card-section>
          <div class="text-caption">Additionally, you can select a tabset to be opened automatically.</div>
        </q-card-section>
        <q-card-section>
          <div>
            <q-select class="q-ml-md" v-model="collection" :options="collections" label="Open Tabset" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <DialogButton label="Cancel" @wasClicked="onDialogHide" />
          <DialogButton
            label="Stash open tabs"
            type="submit"
            :autofocus="true"
            @keyup.enter="display()"
            @wasClicked="display()"
            :default-action="true" />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const oldSessionName = ref<string>(new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString())
const sessionName = ref<string>('')
const collection = ref(null)
const collections = ref<object[]>([])

watchEffect(() => {
  if (sessionName.value) {
    sessionName.value = sessionName.value.replace(STRIP_CHARS_IN_USER_INPUT, '')
    if (sessionName.value.length > 20) {
      sessionName.value = sessionName.value.substring(0, 20)
    }
  }
})

onMounted(() => {
  collections.value = [...useTabsetsStore().tabsets.values()].map((ts: Tabset) => {
    return {
      label: ts.name,
      value: ts.id,
    }
  })
})

const display = () => {
  onDialogOK({ sessionName: sessionName.value, oldSessionName: oldSessionName.value, collection: collection.value })
}
</script>
