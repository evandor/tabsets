<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Window</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">You can provide a new name for this window</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          dense
          v-model="newWindowName"
          autofocus
          @keydown.enter="updateWindow()"
          error-message="Please do not use special Characters, maximum length is 32"
          :error="!newWindowNameIsValid" />
        <!--        <div class="text-body2 text-warning">{{ newTabsetDialogWarning() }}</div>-->
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn label="Cancel" size="sm" color="accent" @click="onDialogCancel" />
        <q-btn
          label="Update"
          size="sm"
          color="warning"
          :disable="disableSubmit()"
          v-close-popup
          @click="updateWindow()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { RenameWindowCommand } from 'src/windows/commands/RenameWindow'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { computed, ref, watchEffect } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  windowId: { type: Number, required: true },
  currentName: { type: String, required: true },
  index: { type: Number, required: true },
  holderId: { type: Number, required: false },
})

const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newWindowName = ref<string>(props.currentName)
const newWindowNameExists = ref(false)

watchEffect(() => {
  // TODO
  newWindowNameExists.value = false //!!useTabsetsStore().existingInTabset(newWindowName.value);
})

const updateWindow = () =>
  useCommandExecutor()
    .executeFromUi(new RenameWindowCommand(props.windowId, props.holderId, newWindowName.value, props.index))
    .then((result: ExecutionResult<string>) => {
      onDialogOK({ name: newWindowName.value })
    })

const newWindowNameIsValid = computed(() => {
  if (newWindowName.value === props.currentName) {
    return true
  }
  if (newWindowName.value?.length > 32 || STRIP_CHARS_IN_USER_INPUT.test(newWindowName.value)) {
    return false
  }
  if (useWindowsStore().windowSet.has(newWindowName.value)) {
    return false
  }
  return true
})

const disableSubmit = (): boolean => {
  return newWindowName.value.trim().length === 0 || newWindowName.value === props.currentName
}
</script>

<style lang="sass" scoped>
.my-input
  max-width: 250px
</style>
