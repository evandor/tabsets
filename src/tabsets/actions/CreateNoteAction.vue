<template>
  <template v-if="props.level === 'root'">
    <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_description" color="primary" label="New Note">
      <!--    <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">-->
      <!--      Stop sharing first if you want to delete this tabset-->
      <!--    </q-tooltip>-->
    </ContextMenuItem>
  </template>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useNavigationService } from 'src/core/services/NavigationService'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'

const props = defineProps<ActionProps>()

const clicked = () => {
  const url =
    chrome && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('www/index.html') + '#/mainpanel/notes/?tsId=' + props.tabset.id + '&edit=true'
      : '#/mainpanel/notes/?tsId=' + props.tabset.id + '&edit=true'
  //  NavigationService.openOrCreateTab([url])
  useNavigationService().browserTabFor(url)
}
</script>
