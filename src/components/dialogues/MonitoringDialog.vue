<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Change Monitor</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">Activate Monitoring for Changes on this website</div>
      </q-card-section>

      <q-card-section class="q-pt-none">

        <div class="q-pa-md q-gutter-sm" v-if="tab.monitor?.type === MonitoringType.CONTENT_HASH">
          This website is being monitored
        </div>

      </q-card-section>


      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="Start" v-if="!tab.monitor"
               v-close-popup
               @click="setMonitoring(MonitoringType.CONTENT_HASH)"/>
        <q-btn flat label="Stop" v-else
               v-close-popup
               @click="setMonitoring(MonitoringType.NONE)"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {PropType} from "vue";
import {useDialogPluginComponent} from "quasar";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {MonitoringType} from "src/models/Monitor";
import {UpdateMonitoringCommand} from "src/domain/monitoring/UpdateMonitoringCommand";
import {Tab} from "src/models/Tab";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  note: {type: String, default: ''}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()


const setMonitoring = (type: MonitoringType) => {
  useCommandExecutor().executeFromUi(new UpdateMonitoringCommand(props.tab, type))
}


</script>
