<template>
  <div class="q-pa-md q-gutter-sm">
    <q-banner rounded style="border: 1px solid orange"
      >You can export your data in various formats and re-import them from json. Please note that it
      is not guaranteed that older exports can be imported with newer versions of the tabsets
      extension.
    </q-banner>

    <div class="row q-pa-md">
      <div class="col-3"><b>Export</b></div>
      <div class="col-3">
        as json or as bookmarks<br />
        export to github is available
        <span class="cursor-pointer text-accent" @click="emits('showTab', 'backup')">here</span>.
      </div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-btn @click="showExportDialog" flat round dense icon="file_download" color="primary">
          <q-tooltip>Export your tabsets</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="row q-pa-md">
      <div class="col-3"><b>Import</b></div>
      <div class="col-3">
        from json or
        <span class="cursor-pointer text-accent" @click="emits('showTab', 'backup')"
          >github backup</span
        ><br />
        You might need to restart tabsets.
      </div>
      <div class="col-1"></div>
      <div class="col-5">
        <q-btn @click="showImportDialog" flat round dense icon="file_upload" color="primary">
          <q-tooltip>Import your tabsets backup</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ExportDialog from 'src/tabsets/dialogues/ExportDialog.vue'
import ImportDialog from 'src/tabsets/dialogues/ImportDialog.vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const emits = defineEmits(['showTab'])

const showExportDialog = () =>
  $q.dialog({ component: ExportDialog, componentProps: { inSidePanel: true } })
const showImportDialog = () =>
  $q.dialog({ component: ImportDialog, componentProps: { inSidePanel: true } })
</script>
