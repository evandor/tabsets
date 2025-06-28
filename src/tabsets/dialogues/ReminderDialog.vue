<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Tab Reminder</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-pa-none q-ma-none">
          <q-date v-model="reminderDate" minimal :options="(date) => futureDatesOnly(date)" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-pa-none q-ma-none">
          <q-input v-model="editor" filled type="textarea" autogrow label="reminder comment" clearable />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn flat label="Clear" @click="setReminder(true)" v-close-popup />
        <q-btn
          flat
          :label="props.date ? 'Update Reminder' : 'Save Reminder'"
          v-close-popup
          @click="setReminder(false)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { date, useDialogPluginComponent } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { SetReminderCommand } from 'src/tabsets/commands/SetReminderCommand'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'

import addToDate = date.addToDate

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps<{ tabId: string; date?: number; comment?: string }>()

const reminderDate = ref(date.formatDate(props.date ? props.date : addToDate(new Date(), { days: 1 }), 'YYYY/MM/DD'))
const editor = ref(props.comment)

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value)
})

const setReminder = (clear: boolean) =>
  useCommandExecutor().executeFromUi(
    new SetReminderCommand(props.tabId, clear ? undefined : reminderDate.value, clear ? undefined : editor.value),
  )

const futureDatesOnly = (d: string) => {
  // console.log('===', d, date.extractDate(d, 'YYYY/MM/DD').getTime(), new Date().getTime() - 1000 * 24 * 60 * 60)
  return date.extractDate(d, 'YYYY/MM/DD').getTime() >= new Date().getTime() - 1000 * 24 * 60 * 60
}
</script>
