<template>
  <template v-if="props.level === 'root'">
    <q-separator inset />
    <ContextMenuItem
      v-close-popup
      @was-clicked="clicked()"
      icon="calendar_view_month"
      color="primary"
      label="Show in Gallery">
    </ContextMenuItem>
  </template>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import NavigationService from 'src/services/NavigationService'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'

const props = defineProps<ActionProps>()

const clicked = () => {
  NavigationService.openOrCreateTab([
    chrome.runtime.getURL(`www/index.html#/mainpanel/tabsets/overview/${props.tabset.id}`),
  ])
}
</script>
