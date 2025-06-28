<template>
  <q-separator inset />
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_file_download" color="primary" label="Export..." />
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import ExportDialog from 'src/tabsets/dialogues/ExportDialog.vue'

const $q = useQuasar()

const props = defineProps<ActionProps>()

const clicked = () => {
  const filename = `tabset-${props.tabset.name}-${import.meta.env.PACKAGE_VERSION}.json`
  $q.dialog({ component: ExportDialog, componentProps: { filename: filename, tabset: props.tabset } }).onOk(
    (tabsetId: any) => {
      //useTabsetService().selectTabset(tabsetId)
    },
  )
}
</script>
