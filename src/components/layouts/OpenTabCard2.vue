<template>

  <div v-if="showSelectIcon(chromeTab)" class="col-1 q-mr-md q-ml-none q-mt-xs ">
    <q-checkbox
      v-if="showSelectIcon(chromeTab)"
      v-model="chromeTab.selected"
      size="30px"
      checked-icon="task_alt"
      @update:model-value="val => selectionChanged(val)"
      unchecked-icon="check_box_outline_blank"
    />
  </div>

  <div class="col-1 q-mt-xs">
    <TabFaviconWidget
      :preventDragAndDrop="true"
      :tab="toTab(chromeTab)" width="20px" height="20px"/>
  </div>

  <div class="col-9 q-mt-xs text-body2 ellipsis cursor-pointer"
       :class="isCurrentTab(toTab(chromeTab)) ? 'text-bold' : ''"
       @click="NavigationService.openOrCreateTab([chromeTab?.url || ''])">
    {{ chromeTab?.title }}
    <q-tooltip class="tooltip" v-if="useSettingsStore().isEnabled('dev')">
      {{ chromeTab.id }} / {{ chromeTab.url }}
    </q-tooltip>
    <q-tooltip class="tooltip" v-else>
      {{ chromeTab.url }}
    </q-tooltip>
  </div>
  <div class="col q-mt-xs text-right cursor-pointer" v-if="!props.useSelection && showIcons">
    <q-icon name="o_add_circle" color="warning q-mr-sm" class="cursor-pointer" size="sm" @click="addToCurrentTabset">
      <q-tooltip class="tooltip">Click here to add the tab to your current tabset {{
          tabsStore.currentTabsetName
        }}
      </q-tooltip>
    </q-icon>
    <q-icon name="close" class="cursor-pointer" @click="closeTab(chromeTab)">
      <q-tooltip class="tooltip">Close this tab in the browser</q-tooltip>
    </q-icon>
  </div>
</template>

<script setup lang="ts">

import {Tab} from "src/models/Tab"
import NavigationService from "src/services/NavigationService"
import TabFaviconWidget from "src/components/widgets/TabFaviconWidget.vue"
import {useTabsetService} from "src/services/TabsetService2";
import {useUiStore} from "src/stores/uiStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {useUtils} from "src/services/Utils"
import {useSettingsStore} from "src/stores/settingsStore"
import {PropType, ref} from "vue";
import ChromeApi from "src/services/ChromeApi";
import {uid} from "quasar";

const props = defineProps({
  chromeTab: {type: Object as PropType<chrome.tabs.Tab>, required: true},
  windowId: {type: Number, required: true},
  useSelection: {type: Boolean, default: false}
})

const emits = defineEmits(['selectionChanged', 'addedToTabset', 'hasSelectable'])

const {isCurrentTab} = useUtils()

const tabsStore = useTabsStore()

const showIcons = ref(false)

const closeTab = (tab: chrome.tabs.Tab) => {
  NavigationService.closeChromeTab(tab)
  tabsStore.pendingTabset.tabs = _.filter(tabsStore.pendingTabset.tabs, t => t.url !== tab.url)
}


const self = chrome.runtime?.getURL("")

const isSelf = (url: string) => url.startsWith(self)

const emitInfo = (msg: string | undefined) => useUiStore().footerInfo = msg

const addToCurrentTabset = () => {
  useCommandExecutor().executeFromUi(new CreateTabFromOpenTabsCommand(props.chromeTab as unknown as Tab, 0))
    .then(() => emits('addedToTabset', {tabId: props.chromeTab.id, tabUrl: props.chromeTab.url}))
}

const selectionChanged = (val: any) => {
  //console.log("emitting", val)
  emits('selectionChanged', {tabId: props.chromeTab.id, selected: val})
}

const showAddToTabsetIcon = (tab: chrome.tabs.Tab) => {
  return tabsStore.currentTabsetId && !props.useSelection && !useTabsetService().urlExistsInCurrentTabset(tab.url || '')
}

const showSelectIcon = (tab: chrome.tabs.Tab) => props.useSelection && !useTabsetService().urlExistsInCurrentTabset(tab.url || '')

const toTab = (chromeTab: chrome.tabs.Tab) => new Tab(uid(), chromeTab)

</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0

</style>
