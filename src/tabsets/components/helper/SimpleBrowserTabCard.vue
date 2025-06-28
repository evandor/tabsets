<template>
  <div class="row q-ma-none q-pa-none" @mouseenter="showIcons = true" @mouseleave="showIcons = false">
    <div class="col-2 q-mt-xs" style="text-align: center">
      <TabFaviconWidget :preventDragAndDrop="true" :tab="toTab(chromeTab)" width="20px" height="20px" />
    </div>

    <div
      class="col-7 q-mt-sm q-ml-xs text-body2 ellipsis cursor-pointer"
      :class="TabService.isCurrentTab(toTab(chromeTab)) ? 'text-bold' : ''"
      @click="useNavigationService().browserTabFor(chromeTab.url!)">
      {{ chromeTab?.title }}
      <q-tooltip class="tooltip" v-if="useSettingsStore().has('DEV_MODE')">
        {{ chromeTab.id }} / {{ chromeTab.url }} / {{ chromeTab.index }}
      </q-tooltip>
      <q-tooltip class="tooltip" v-else>
        {{ chromeTab.url }}
      </q-tooltip>
    </div>
    <div class="col-1 q-mt-xs text-right">
      <q-icon v-if="existsInTabset" name="link" :color="existsInCurrentTabset ? 'green' : 'warning'">
        <q-tooltip class="tooltip-small" v-if="existsInCurrentTabset"
          >Already contained in the current tabset</q-tooltip
        >
        <q-tooltip class="tooltip-small" v-else>Already contained in a tabset</q-tooltip>
      </q-icon>
    </div>
    <div class="col q-mt-xs text-right">
      <template v-if="showIcons">
        <q-icon
          name="o_add_circle"
          :color="alreadyInCurrentTabset ? 'grey' : 'warning'"
          class="q-mr-xs"
          :class="alreadyInCurrentTabset ? '' : 'cursor-pointer'"
          size="xs"
          @click="addToCurrentTabset">
        </q-icon>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { uid } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import NavigationService from 'src/services/NavigationService'
import TabService from 'src/services/TabService'
import { CreateTabFromOpenTabsCommand } from 'src/tabsets/commands/CreateTabFromOpenTabs'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { onMounted, PropType, ref } from 'vue'

const props = defineProps({
  chromeTab: { type: Object as PropType<chrome.tabs.Tab>, required: true },
})

const emits = defineEmits(['selectionChanged', 'addedToTabset', 'hasSelectable'])

const showIcons = ref(false)
const alreadyInCurrentTabset = ref(false)
const existsInTabset = ref(false)
const existsInCurrentTabset = ref(false)

onMounted(() => {
  if (props.chromeTab?.url) {
    existsInTabset.value = useTabsetService().urlExistsInATabset(props.chromeTab.url)
    existsInCurrentTabset.value = useTabsetService().urlExistsInCurrentTabset(props.chromeTab.url)
  }
})

const closeTab = (tab: chrome.tabs.Tab) => {
  NavigationService.closeChromeTab(tab)
}

const addToCurrentTabset = () => {
  useCommandExecutor()
    .executeFromUi(new CreateTabFromOpenTabsCommand(props.chromeTab, 0))
    .then(() => (alreadyInCurrentTabset.value = true))
    .then(() => emits('addedToTabset', { tabId: props.chromeTab.id, tabUrl: props.chromeTab.url }))
}

alreadyInCurrentTabset.value = useTabsetService().urlExistsInCurrentTabset(props.chromeTab.url || '')

const toTab = (chromeTab: chrome.tabs.Tab) => new Tab(uid(), chromeTab)
</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0
</style>
