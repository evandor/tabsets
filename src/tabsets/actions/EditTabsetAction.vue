<template>
  <ContextMenuItem
    v-if="props.level === 'root'"
    v-close-popup
    @was-clicked="clicked()"
    icon="o_edit"
    color="primary"
    :disable="props.tabset.sharing?.sharedId !== undefined"
    :label="props.tabset.type === TabsetType.SESSION ? 'Edit Session' : 'Edit Tabset'">
    <!--    <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">-->
    <!--      Stop sharing first if you want to delete this tabset-->
    <!--    </q-tooltip>-->
  </ContextMenuItem>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import { TabsetType } from 'src/tabsets/models/Tabset'
import { useUiStore } from 'src/ui/stores/uiStore'

const $q = useQuasar()
const props = defineProps<ActionProps>()

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
