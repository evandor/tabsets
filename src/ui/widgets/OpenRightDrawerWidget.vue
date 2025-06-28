<template>
  <q-icon class="cursor-pointer q-ml-lg" size="1.3em" name="chevron_left" @click="openRightDrawer()">
    <q-tooltip class="tooltip">Show the right drawer again</q-tooltip>
  </q-icon>
</template>

<script lang="ts" setup>
import { useUiStore } from 'src/ui/stores/uiStore'

const openRightDrawer = () => {
  console.log('opening drawer...')
  useUiStore().rightDrawerOpen = true
}
</script>
