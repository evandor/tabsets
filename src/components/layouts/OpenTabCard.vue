<template>

  <q-card class="tabBorder" flat
          :style="cardStyle(tab)">

    <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;">

      <div class="row items-baseline">
        <div class="col-1 q-mr-md q-ml-none">
          <q-icon v-if="showAddToTabsetIcon(tab)" color="primary"
            name="o_arrow_left" @click="addToCurrentTabset" size="2em">
            <q-tooltip class="tooltip">
              Click here to add the tab to your current tabset
            </q-tooltip>
          </q-icon>
          <q-checkbox
            v-if="showSelectIcon(tab)"
            v-model="tab.selected"
            size="30px"
            checked-icon="task_alt"
            @update:model-value="val => selectionChanged(val)"
            unchecked-icon="check_box_outline_blank"
          />
        </div>

        <div class="col-2">
          <TabFaviconWidget :tab="tab" width="20px" height="20px"/>
        </div>

        <div class="col-7 text-body2 ellipsis cursor-pointer"
             @mouseenter="emitInfo(tab.chromeTab?.url)"
             @mouseout="emitInfo(undefined)"
             @click="NavigationService.openOrCreateTab(tab.chromeTab?.url)">
          <span v-if="tab.chromeTab?.discarded">*</span>&nbsp;{{ tab.chromeTab?.title }}
        </div>
        <div class="col-1" v-if="!props.useSelection">
          <q-icon name="close" @click="closeTab(tab)" v-if="!isSelf(tab.chromeTab.url)">
            <q-tooltip class="tooltip">Close this tab in the browser</q-tooltip>
          </q-icon>
        </div>
      </div>

    </q-card-section>


  </q-card>
</template>

<script setup lang="ts">

import {Tab} from "src/models/Tab"
import NavigationService from "src/services/NavigationService"
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore"
import TabFaviconWidget from "src/components/widgets/TabFaviconWidget.vue"
import {useTabsetService} from "src/services/TabsetService2";
import {useUiStore} from "src/stores/uiStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/domain/commands/CreateTabFromOpenTabs";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"

const featureToggles = useFeatureTogglesStore()

const props = defineProps({
  tab: {
    type: Object,
    required: true
  },
  useSelection: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['selectionChanged','addedToTabset','hasSelectable'])

const tabsStore = useTabsStore()

const closeTab = (tab: Tab) => {
  NavigationService.closeChromeTab(tab)
  tabsStore.pendingTabset.tabs = _.filter(tabsStore.pendingTabset.tabs, t => t.chromeTab.url !== tab.chromeTab.url)
}

const cardStyle = (tab: Tab) => {
  const height = "30px";
  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  if (useTabsetService().urlExistsInCurrentTabset(tab.chromeTab?.url || '')) {
    background = "background: #efefef"
  } else {
    emits('hasSelectable', true)
  }
  return `height: ${height};max-height:${height}; min-height: ${height};position:relative; top:5px;${background}`
}

const self = chrome.runtime?.getURL("")

const isSelf = (url: string) => url.startsWith(self)

const emitInfo = (msg: string | undefined) => useUiStore().footerInfo = msg

const addToCurrentTabset = () => {
  useCommandExecutor().executeFromUi(new CreateTabFromOpenTabsCommand(props.tab as unknown as Tab, 0, 'openTabs'))
    .then((res) => emits('addedToTabset', {tabId: props.tab.id, tabUrl: props.tab.chromeTab.url}))
}

const selectionChanged = (val: any) => {
  //console.log("emitting", val)
  emits('selectionChanged', {tabId: props.tab.id, selected: val})
}

const showAddToTabsetIcon = (tab: Tab) => {
  return tabsStore.currentTabsetId && !props.useSelection && !useTabsetService().urlExistsInCurrentTabset(tab.chromeTab?.url || '')
}

const showSelectIcon = (tab: Tab) => props.useSelection && !useTabsetService().urlExistsInCurrentTabset(tab.chromeTab?.url || '')

</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0px

</style>
