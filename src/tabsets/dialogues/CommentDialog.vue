<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Tab Comment</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-pa-none q-ma-none">
          <!--          <q-editor v-model="editor" min-height="5rem" />-->

          <q-input v-model="editor" filled type="textarea" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <DialogButton label="Cancel" @click="onDialogCancel" />
        <DialogButton
          :label="props.sharedId ? 'Publish Comment' : props.comment ? 'Update Comment' : 'Save Comment'"
          @was-clicked="publishComment()"
          :default-action="true" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { AddCommentCommand } from 'src/tabsets/commands/AddCommentCommand'
import { UpdateCommentCommand } from 'src/tabsets/commands/UpdateCommentCommand'
import { TabComment } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { PropType, ref, watchEffect } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  tabId: { type: String, required: true },
  sharedId: { type: String, required: false },
  comment: { type: Object as PropType<TabComment>, required: false },
})

const editor = ref(props.comment?.comment || '')

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value)
})

const publishComment = () =>
  props.comment
    ? useCommandExecutor().executeFromUi(new UpdateCommentCommand(props.tabId, props.comment, editor.value))
    : useCommandExecutor().executeFromUi(new AddCommentCommand(props.tabId, editor.value))
</script>
