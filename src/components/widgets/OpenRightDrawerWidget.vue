<template>
  <q-icon v-if="!uiStore.rightDrawerOpen"
          class="cursor-pointer q-ml-lg" size="1.3em"
          name="chevron_left" @click="openRightDrawer()">
    <q-tooltip class="tooltip">Show the right drawer again</q-tooltip>
  </q-icon>
</template>

<script lang="ts" setup>

import {useUiStore} from "src/stores/uiStore";

const uiStore = useUiStore()

const openRightDrawer = () => useUiStore().rightDrawerOpen = true

</script>
