<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Notification</div>
      </q-card-section>
      <!--      <q-card-section>-->
      <!--        <div class="text-body">Please provide a name</div>-->
      <!--      </q-card-section>-->

      <q-card-section class="q-pt-none">
        <div class="text-body">{{ notification }}</div>


      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat label="OK" v-close-popup @click="ok"/>
      </q-card-actions>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {useDialogPluginComponent, useQuasar} from "quasar";
import {useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {CreateTabsetCommand} from "src/domain/commands/CreateTabsetCommand";
import TabsetService from "src/services/TabsetService";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useUiStore} from "stores/uiStore";
import {useNotificationsStore} from "stores/notificationsStore";
import NotificationsService from "src/services/NotificationsService";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  notificationId: {
    type: String,
    required: true
  }
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const notificationsStore = useNotificationsStore()
const router = useRouter()
const $q = useQuasar()

const notification = ref(notificationsStore.getNotification(props.notificationId))
const newTabsetNameExists = ref(false)
const ok = () => NotificationsService.markRead(props.notificationId)







</script>
