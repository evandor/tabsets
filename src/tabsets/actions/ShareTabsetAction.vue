<template>
  <q-separator inset />
  <ContextMenuItem icon="open_in_new" label="Sharing..." color="primary">
    <q-item-section side>
      <q-icon name="keyboard_arrow_right" />
    </q-item-section>
    <q-menu>
      <ShareTabsetActionSecondLevelMenu :tabset="props.tabset" />
    </q-menu>
  </ContextMenuItem>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import ShareTabsetActionSecondLevelMenu from 'src/tabsets/actions/ShareTabsetActionSecondLevelMenu.vue'

type ShareTabsetActionProps = ActionProps
const props = defineProps<ShareTabsetActionProps>()
</script>
