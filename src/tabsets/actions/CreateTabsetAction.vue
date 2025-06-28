<template>
  <template v-if="props.level === 'root'">
    <ContextMenuItem
      v-close-popup
      @was-clicked="clicked()"
      icon="o_add"
      color="primary"
      :indicate-issue="cannotCreateCollection()"
      label="Create Tabset">
    </ContextMenuItem>
  </template>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const clicked = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().getCurrentTabset?.id,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true,
    },
  })
}

const cannotCreateCollection = () => false
</script>
