<template>
  <q-item-section @mouseover="hoveredSpace = props.spaceId" @mouseleave="hoveredSpace = undefined">
    <q-item-label :class="spacesStore.space?.id === props.spaceId ? 'text-bold' : ''">
      <q-icon color="positive" name="o_space_dashboard" style="position: relative; top: -2px" />
      {{ props.spaceLabel }}
    </q-item-label>
    <q-item-label class="text-caption">
      {{ props.caption }}
    </q-item-label>
  </q-item-section>
  <q-item-section style="max-width: 100px">
    <q-btn
      v-if="props.spaceOpen"
      dense
      outline
      size="xs"
      class="cursor-pointer"
      icon="o_add"
      @click="openNewTabsetDialog(props.spaceId)"
      label="Add Tabset">
      <q-tooltip class="tooltip">Add Tabset</q-tooltip>
    </q-btn>
  </q-item-section>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref } from 'vue'

const $q = useQuasar()

const props = defineProps({
  spaceId: { type: String, required: true },
  caption: { type: String, required: true },
  spaceLabel: { type: String, required: true },
  spaceOpen: { type: Boolean, default: false },
})

const spacesStore = useSpacesStore()
const hoveredSpace = ref<string | undefined>(undefined)

const openNewTabsetDialog = async (spaceId: string) => {
  const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: currentTabsetId,
      spaceId: spaceId,
      fromPanel: true,
    },
  })
}
</script>
