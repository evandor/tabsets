<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Rapid URL</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="q-pa-none q-ma-none"></div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn flat label="label" @click="okClick()" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const props = defineProps<{ url: string }>()

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const newTabsetName = ref('')
const newTabsetNameExists = ref(false)

const okClick = () => {}

watchEffect(() => {
  newTabsetNameExists.value = !!useTabsetsStore().existingInTabset(newTabsetName.value)
})
</script>
