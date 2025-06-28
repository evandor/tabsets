<template>
  <div class="q-gutter-md row items-start fit">
    <q-input
      dense
      standout
      filled
      autofocus
      placeholder="Filter Open Tabs"
      class="fit q-mx-md"
      color="primary"
      bg-color="white"
      label-color="primary"
      v-model="search">
    </q-input>
  </div>
</template>

<script lang="ts" setup>
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'

const search = ref('')

watchEffect(() => {
  useUiStore().toolbarFilterTerm = search.value
})
</script>
