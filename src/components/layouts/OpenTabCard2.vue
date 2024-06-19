<template>

  <div class="row q-ma-none q-pa-none"
       @mouseenter="showIcons = true"
       @mouseleave="showIcons = false">

    <div class="col-2 q-mt-xs" style="text-align: center">
      <q-checkbox
        v-if="showSelectIcon(chromeTab)"
        v-model="chromeTab.selected"
        size="30px"
        checked-icon="task_alt"
        @update:model-value="val => selectionChanged(val)"
        unchecked-icon="check_box_outline_blank"
      />
      <TabFaviconWidget
        :preventDragAndDrop="true"
        :tab="toTab(chromeTab)" width="20px" height="20px"/>
    </div>

    <div class="col-8 q-mt-sm q-ml-xs text-body2 ellipsis cursor-pointer"
         :class="TabService.isCurrentTab(toTab(chromeTab)) ? 'text-bold' : ''"
         @click="NavigationService.openChromeTab(chromeTab)">
      {{ chromeTab?.title }}
      <q-tooltip class="tooltip" v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">
        {{ chromeTab.id }} / {{ chromeTab.url }}
      </q-tooltip>
      <q-tooltip class="tooltip" v-else>
        {{ chromeTab.url }}
      </q-tooltip>
    </div>
    <div class="col q-mt-xs text-right">
      <template v-if="!props.useSelection && showIcons">
        <q-icon name="o_add_circle"
                :color="alreadyInCurrentTabset ? 'grey' : 'warning'"
                class="q-mr-sm"
                :class="alreadyInCurrentTabset ? '' : 'cursor-pointer'" size="xs"
                @click="addToCurrentTabset">
          <q-tooltip class="tooltip" v-if="alreadyInCurrentTabset">This tab has already been added to {{useTabsetsStore().currentTabsetName}}</q-tooltip>
          <q-tooltip class="tooltip" v-else>Click here to add the tab to your current tabset {{useTabsetsStore().currentTabsetName}}</q-tooltip>
        </q-icon>
        <q-icon name="close" class="cursor-pointer" @click="closeTab(chromeTab)" size="xs">
          <q-tooltip class="tooltip">Close this tab in the browser</q-tooltip>
        </q-icon>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">

import {Tab} from "src/tabsets/models/Tab"
import NavigationService from "src/services/NavigationService"
import TabFaviconWidget from "src/tabsets/widgets/TabFaviconWidget.vue"
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {CreateTabFromOpenTabsCommand} from "src/tabsets/commands/CreateTabFromOpenTabs";
import {PropType, ref, watch, watchEffect} from "vue";
import {uid} from "quasar";
import TabService from "src/services/TabService";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import {useTabsetsStore} from "../../tabsets/stores/tabsetsStore";

const props = defineProps({
  chromeTab: {type: Object as PropType<chrome.tabs.Tab>, required: true},
  windowId: {type: Number, required: true},
  useSelection: {type: Boolean, default: false}
})

const emits = defineEmits(['selectionChanged', 'addedToTabset', 'hasSelectable'])

const showIcons = ref(false)
const alreadyInCurrentTabset = ref(false)

const closeTab = (tab: chrome.tabs.Tab) => {
  NavigationService.closeChromeTab(tab)
  // tabsStore.pendingTabset.tabs = _.filter(tabsStore.pendingTabset.tabs, t => t.url !== tab.url)
}

const self = chrome.runtime?.getURL("")

const addToCurrentTabset = () => {
  useCommandExecutor().executeFromUi(new CreateTabFromOpenTabsCommand(props.chromeTab as unknown as Tab, 0))
    .then(() => alreadyInCurrentTabset.value = true)
    .then(() => emits('addedToTabset', {tabId: props.chromeTab.id, tabUrl: props.chromeTab.url}))
}

const selectionChanged = (val: any) => {
  emits('selectionChanged', {tabId: props.chromeTab.id, selected: val})
}

alreadyInCurrentTabset.value = useTabsetService().urlExistsInCurrentTabset(props.chromeTab.url || '')

const showSelectIcon = (tab: chrome.tabs.Tab) => props.useSelection && !useTabsetService().urlExistsInCurrentTabset(tab.url || '')

const toTab = (chromeTab: chrome.tabs.Tab) => new Tab(uid(), chromeTab)

</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0

</style>
