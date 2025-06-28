<template>
  <ContextMenuItem
    v-close-popup
    @was-clicked="clicked()"
    icon="o_tab"
    color="primary"
    :disable="props.tabset.sharing?.sharedId !== undefined"
    :label="context?.label || '???'">
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ComponentContext } from 'src/tabsets/actionHandling/TabActionMatcher'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useUiStore } from 'src/ui/stores/uiStore'

const $q = useQuasar()
const props = defineProps<{ tabset: Tabset; context?: ComponentContext }>()

const clicked = () => {
  $q.dialog({
    component: EditTabsetDialog,
    //TODO switch to tabset: tabset?
    componentProps: {
      tabsetId: props.tabset.id,
      tabsetName: props.tabset.name,
      tabsetColor: props.tabset.color,
      window: props.tabset.window,
      details: props.tabset.details || useUiStore().listDetailLevel,
      fromPanel: true,
    },
  })
}
</script>
