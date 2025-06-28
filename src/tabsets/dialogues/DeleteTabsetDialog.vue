<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">Delete Tabset</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body">
            Would you like to delete the tabset: <em>{{ props.tabsetName }}</em
            >?
          </div>
        </q-card-section>
        <q-card-section>
          <div class="text-body2">
            This tabset contains {{ props.tabsCount }} {{ props.tabsCount > 1 ? 'tabs' : 'tab' }} which will be deleted
            as well, including their comments and snapshots
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <DialogButton label="Cancel" />
          <DialogButton
            label="Delete"
            type="submit"
            :disable="!isValid"
            :autofocus="true"
            @keyup.enter="deleteTabset()"
            @wasClicked="deleteTabset()"
            :default-action="true" />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { DeleteTabsetCommand } from 'src/tabsets/commands/DeleteTabsetCommand'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps({
  tabsetId: { type: String, required: true },
  tabsetName: { type: String, required: true },
  tabsCount: { type: Number, default: 0 },
  redirectTo: { type: String, default: '/sidepanel' },
  sidePanelMode: { type: Boolean, default: true },
})

const { dialogRef, onDialogHide } = useDialogPluginComponent()

const router = useRouter()
const isValid = ref(true)

const deleteTabset = () =>
  useCommandExecutor()
    .executeFromUi(new DeleteTabsetCommand(props.tabsetId))
    .then((res: any) => {
      router.push(props.redirectTo)
      return res
    })
</script>
