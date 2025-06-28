<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-card class="q-dialog-plugin" style="max-width: 100%">
        <q-card-section>
          <div class="text-h6">Check for Changes</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body" v-if="monitored">Would you like to delete the tabset</div>
          <div class="text-body" v-else>
            Click ok to start periodical checks if this website has changed. This information is not reliable and may
            not work for all websites.
          </div>
        </q-card-section>
        <q-card-section>
          <div class="text-body2">
            <q-checkbox v-model="snapshot" label="Create Snapshot to compare with" :disable="snapshotDisabled" />
            <div class="text-caption q-ml-sm" v-if="snapshotDisabled && !wrongPage">
              Snapshot cannot be created, please activate the Save Page Feature in the settings.
            </div>
            <div class="text-caption q-ml-sm" v-if="snapshotDisabled && wrongPage">
              Snapshot can only be created for the active tab.
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <DialogButton label="Cancel" />
          <DialogButton
            :label="monitored ? 'Stop' : 'Start Monitoring'"
            type="submit"
            :disable="!isValid"
            :autofocus="true"
            @keyup.enter="startMonitoring()"
            @wasClicked="startMonitoring()"
            :default-action="true" />
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useTabsStore } from 'src/bookmarks/stores/tabsStore'
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { MonitorCommand } from 'src/tabsets/commands/MonitorCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { ref } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps<{
  monitored: boolean
  tab: Tab
}>()

const { dialogRef, onDialogHide } = useDialogPluginComponent()

const isValid = ref(true)
const snapshot = ref(false)
const snapshotDisabled = ref(true)
const wrongPage = ref(false)

if (useFeaturesStore().hasFeature(FeatureIdent.SAVE_MHTML)) {
  snapshotDisabled.value = false
}
if (props.tab.url !== useTabsStore().currentChromeTab?.url) {
  snapshotDisabled.value = true
  wrongPage.value = true
}

const startMonitoring = () => {
  useCommandExecutor().executeFromUi(new MonitorCommand(props.tab, snapshot.value, !props.monitored)) // })
}
// cancel: true, // persistent: true, // }).onOk(() => { // useCommandExecutor().executeFromUi(new
//MonitorCommand(props.tab.id, !monitored)) // })
</script>
