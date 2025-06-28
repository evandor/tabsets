<template>
  <div class="row q-ma-none q-pa-none" @mouseenter="showIcons = true" @mouseleave="showIcons = false">
    <div class="col-2 q-mt-xs" style="text-align: center">
      <q-checkbox
        v-model="selected"
        size="30px"
        checked-icon="task_alt"
        @update:model-value="(val) => selectionChanged(val)"
        unchecked-icon="check_box_outline_blank" />
      <TabFaviconWidget :preventDragAndDrop="true" :tab="toTab(chromeTab)" width="20px" height="20px" />
    </div>

    <div
      class="col-7 q-mt-sm q-ml-xs text-body2 ellipsis cursor-pointer"
      :class="TabService.isCurrentTab(toTab(chromeTab)) ? 'text-bold' : ''"
      @click="NavigationService.openChromeTab(chromeTab)">
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
          >Already contained in the current tabset {{ useTabsetsStore().currentTabsetName }}
        </q-tooltip>
        <q-tooltip class="tooltip-small" v-else>Already contained in a tabset</q-tooltip>
      </q-icon>
    </div>
    <div class="col q-mt-xs text-right">
      <template v-if="showIcons">
        <q-icon
          :name="alreadyInCurrentTabset ? 'o_do_not_disturb_on' : 'o_add_circle'"
          :color="alreadyInCurrentTabset ? 'grey' : 'warning'"
          class="q-mr-xs cursor-pointer"
          size="xs"
          @click="addOrRemoveFromTabset(chromeTab.url)">
          <q-tooltip class="tooltip" v-if="alreadyInCurrentTabset"
            >Remove this tab from collection
            {{ useTabsetsStore().currentTabsetName }}
          </q-tooltip>
          <q-tooltip class="tooltip" v-else
            >Click here to add the tab to your current tabset
            {{ useTabsetsStore().currentTabsetName }}
          </q-tooltip>
        </q-icon>
        <q-icon name="close" class="cursor-pointer" @click="closeTab(chromeTab)" size="xs">
          <q-tooltip class="tooltip">Close this tab in the browser</q-tooltip>
        </q-icon>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { uid } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import NavigationService from 'src/services/NavigationService'
import TabService from 'src/services/TabService'
import { CreateTabFromOpenTabsCommand } from 'src/tabsets/commands/CreateTabFromOpenTabs'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { PropType, ref, watchEffect } from 'vue'
import { useTabsetsStore } from '../../tabsets/stores/tabsetsStore'

const props = defineProps({
  chromeTab: { type: Object as PropType<chrome.tabs.Tab>, required: true },
  windowId: { type: Number, required: true },
  useSelection: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})

const emits = defineEmits(['selectionChanged', 'addedToTabset', 'hasSelectable'])

const showIcons = ref(false)
const alreadyInCurrentTabset = ref(false)
const existsInTabset = ref(false)
const existsInCurrentTabset = ref(false)
const selected = ref(props.selected)

const closeTab = (tab: chrome.tabs.Tab) => {
  NavigationService.closeChromeTab(tab)
}

const addOrRemoveFromTabset = (url: string | undefined) => {
  if (alreadyInCurrentTabset.value && url) {
    const currentTs = useTabsetsStore().getCurrentTabset
    if (!currentTs) {
      return
    }
    const tab: Tab[] | undefined = currentTs.tabs.filter((t: Tab) => t.url === url)
    if (tab && tab.length > 0) {
      useCommandExecutor()
        .executeFromUi(new DeleteTabCommand(tab[0]!, currentTs))
        .then(() => (alreadyInCurrentTabset.value = false))
      //.then(() => emits('addedToTabset', { tabId: props.chromeTab.id, tabUrl: props.chromeTab.url }))
    }
  } else {
    useCommandExecutor()
      .executeFromUi(new CreateTabFromOpenTabsCommand(props.chromeTab, 0))
      .then(() => (alreadyInCurrentTabset.value = true))
      .then(() => emits('addedToTabset', { tabId: props.chromeTab.id, tabUrl: props.chromeTab.url }))
  }
}

watchEffect(() => {
  if (props.chromeTab?.url) {
    existsInTabset.value = useTabsetService().urlExistsInATabset(props.chromeTab.url)
    existsInCurrentTabset.value = useTabsetService().urlExistsInCurrentTabset(props.chromeTab.url)
  }
})

const selectionChanged = (val: any) => {
  emits('selectionChanged', { tabId: props.chromeTab.id, selected: val })
}

alreadyInCurrentTabset.value = useTabsetService().urlExistsInCurrentTabset(props.chromeTab.url || '')

const showSelectIcon = (tab: chrome.tabs.Tab) =>
  props.useSelection && !useTabsetService().urlExistsInCurrentTabset(tab.url || '')

const toTab = (chromeTab: chrome.tabs.Tab) => new Tab(uid(), chromeTab)
</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0
</style>
