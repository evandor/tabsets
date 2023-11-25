<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div>
      <q-form>
        <q-card class="q-dialog-plugin" style="max-width:100%">
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
            <!--          <q-btn flat label="Cancel" @click="onDialogCancel"/>-->
            <!--          <q-btn flat label="Start" v-if="!tab.monitor"-->
            <!--                 v-close-popup-->
            <!--                 @click.stop="setMonitoring(MonitoringType.CONTENT_HASH)"/>-->
            <!--          <q-btn flat label="Stop" v-else-->
            <!--                 v-close-popup-->
            <!--                 @click.stop="setMonitoring(MonitoringType.NONE)"/>-->

            <DialogButton label="Cancel" color="accent" v-close-popup/>
            <DialogButton :label="tab.monitor ? 'Stop':'Start'"
                          @wasClicked="tab.monitor ? setMonitoring(MonitoringType.NONE) : setMonitoring(MonitoringType.CONTENT_HASH)"
                          type="submit"
                          v-close-popup/>
          </q-card-actions>


        </q-card>
      </q-form>
    </div>
  </q-dialog>

</template>

<script lang="ts" setup>

import {PropType} from "vue";
import {QForm, useDialogPluginComponent} from "quasar";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {MonitoringType} from "src/models/Monitor";
import {UpdateMonitoringCommand} from "src/domain/monitoring/UpdateMonitoringCommand";
import {Tab} from "src/models/Tab";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {SaveTabCommand} from "src/domain/tabs/SaveTab";
import {useTabsStore} from "stores/tabsStore";
import DialogButton from "components/buttons/DialogButton.vue";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {SavePngCommand} from "src/domain/tabs/SavePng";
import {useTabsetService} from "src/services/TabsetService2";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  note: {type: String, default: ''}
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()


const setMonitoring = (type: MonitoringType) => {
  console.log("setMonitoring", type)
  if (type === MonitoringType.CONTENT_HASH &&
      usePermissionsStore().hasPermission('pageCapture') &&
      usePermissionsStore().hasFeature(FeatureIdent.SAVE_TAB)) {
    const callback = (mhtmlId: string) => {
      console.log("got mhtml id", mhtmlId)
      useCommandExecutor().executeFromUi(new UpdateMonitoringCommand(props.tab, type, {
        monitoringSnapshot: {mhtmlId: mhtmlId}
      }))
    }
    useCommandExecutor()
        // .execute(new SaveTabCommand(useTabsStore().getCurrentTabset, props.tab, callback))
        .execute(new SavePngCommand(props.tab, "monitoring start"))
        .then(() => {
          useCommandExecutor().executeFromUi(new UpdateMonitoringCommand(props.tab, type, {}))
          useTabsetService().saveCurrentTabset()
        })
        .catch((err) => {
          useCommandExecutor().executeFromUi(new UpdateMonitoringCommand(props.tab, type, {
            monitoringSnapshotError: err
          }))
        })
  } else {
    useCommandExecutor().executeFromUi(new UpdateMonitoringCommand(props.tab, type))
  }

}


</script>
