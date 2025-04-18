<template>
  <q-icon v-if="showResearchIndicator" name="o_science" size="11px" color="primary" class="q-mr-xs">
    <q-tooltip class="tooltip-small">This Source has associcated reasearch data</q-tooltip>
  </q-icon>
</template>

<script lang="ts" setup>
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { ref, watchEffect } from 'vue'

const props = defineProps({
  tabId: { type: String, required: true },
})

const showResearchIndicator = ref(false)

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  showResearchIndicator.value = (await useSnapshotsStore().metadataFor(props.tabId)).length > 0
})
</script>
