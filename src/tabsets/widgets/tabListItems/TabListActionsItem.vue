<template>
  <span v-if="props.tabset && props.tabset.type !== TabsetType.SESSION">
    <q-btn flat outline text-color="primary" class="cursor-pointer q-pa-none q-ma-none" icon="more_vert" size="sm" />
    <PanelTabListContextMenu v-if="!props.hideMenu" :tabset="props.tabset!" :tabsetId="props.tabset.id!" :tab="tab" />
  </span>
  <span v-else @click="removeSessionTab(tab)" class="q-mr-lg"> x </span>
</template>

<script setup lang="ts">
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import PanelTabListContextMenu from 'src/tabsets/widgets/PanelTabListContextMenu.vue'
import { ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'

const { formatReadingTime } = useUtils()

const props = defineProps<{
  tabset: Tabset | undefined
  tab: Tab
  detailLevel: ListDetailLevel | undefined
  hideMenu?: boolean
}>()

const removeSessionTab = (tab: Tab) => {
  if (props.tabset) {
    useCommandExecutor().executeFromUi(new DeleteTabCommand(tab, props.tabset))
  }
}

const showWithMinDetails = (level: ListDetailLevel) => /*doShowDetails.value ||*/ showDetailsForThreshold(level)

const showDetailsForThreshold = (level: ListDetailLevel) =>
  useUiStore().listDetailLevelGreaterEqual(level, props.tabset?.details, props.detailLevel)
</script>
