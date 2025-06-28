<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Tab References</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">This tab references some other potentially interesting URLs</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-pa-md q-gutter-sm">
          <div class="row" v-for="ref in props.tab.tabReferences" :key="ref.id">
            <span @click="useNavigationService().browserTabFor(ref.href || '')">{{ ref.title }}</span>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn flat label="ok" v-close-popup @click="publishComment()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { AddCommentCommand } from 'src/tabsets/commands/AddCommentCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { PropType, ref, watchEffect } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: true },
})

const editor = ref('')

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value)
})

const publishComment = () => useCommandExecutor().executeFromUi(new AddCommentCommand(props.tab.id, editor.value))
</script>
