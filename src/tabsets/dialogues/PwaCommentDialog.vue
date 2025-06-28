<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Comment</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Publish a comment</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-pa-md q-gutter-sm">
          <!--          <q-editor v-model="editor" min-height="5rem" />-->

          <q-input v-model="editor" filled type="textarea" />
        </div>
      </q-card-section>

      <q-card-section>
        <div class="text-body">Author:</div>
        <q-input
          v-model="author"
          class="q-mb-md q-pb-none"
          dense
          autofocus
          type="text"
          error-message="Please do not use special Characters, maximum length is 32" />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn flat label="Publish Comment" v-close-popup :disable="!author || !editor" @click="publishComment()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { LocalStorage, useDialogPluginComponent } from 'quasar'
import { SHARING_AUTHOR_IDENT } from 'src/boot/constants'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { AddCommentCommand } from 'src/tabsets/commands/AddCommentCommand'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  tabId: { type: String, required: true },
  sharedId: { type: String, required: false },
})

const editor = ref('')
const author = ref<string>(LocalStorage.getItem(SHARING_AUTHOR_IDENT) || '')

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value)
})

const publishComment = () => {
  useUiStore().sharingAuthor = author.value
  useCommandExecutor().executeFromUi(new AddCommentCommand(props.tabId, editor.value))
}
</script>
