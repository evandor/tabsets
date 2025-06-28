<template>
  <template v-if="props.level === 'root'">
    <template v-if="props.element === 'contextmenu'">
      <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="folder" color="warning" :label="label" />
    </template>
    <template v-else>
      <fab-like-btn @button-clicked="clicked()" :color="'warning'" :icon="'add'" />
    </template>
  </template>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import FabLikeBtn from 'src/tabsets/actions/widgets/FabLikeBtn.vue'
import NewSubfolderDialog from 'src/tabsets/dialogues/NewSubfolderDialog.vue'
import { ref } from 'vue'

const props = defineProps<ActionProps>()

const $q = useQuasar()

const label = ref('New Folder')

const clicked = () => {
  console.log('clicked!')
  $q.dialog({
    component: NewSubfolderDialog,
    componentProps: {
      tabsetId: props.tabset.id,
      parentFolder: undefined,
    },
  })
}
</script>
