<template>
  <!-- first time -->
  <div class="row q-ma-sm" v-if="tabsStore.tabsets.size === 0">
    <Transition name="delayed-appear" appear>
      <q-btn class="fit text-warning"
             outline
             data-testid="createFirstTabsetBtn"
             @click="addFirstTabset"
             label="create your first tabset"></q-btn>
    </Transition>
  </div>

  <!-- we have at least one tabset -->
  <div v-else class="q-ma-none">

    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-9">
              <TabsetsSelectorWidget :fromPanel="true"/>
            </div>
            <div class="col-3 text-right">
              <q-icon class="q-ma-xs cursor-pointer" name="filter_center_focus" @click="createClip">
                <q-tooltip class="tooltip">Create website clip</q-tooltip>
              </q-icon>
              <q-icon class="q-ma-xs cursor-pointer" name="open_in_new" @click="openExtensionTab">
                <q-tooltip class="tooltip">Open Tabsets</q-tooltip>
              </q-icon>
            </div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="row q-ma-sm">
      <!--      <div class="col-12">-->
      <!--        <hr>-->
      <!--      </div>-->
      <div class="col-12">
        <div class="row">
          <div class="col-2 text-bold  ">
            Tab
          </div>
          <div class="col-10 ellipsis " v-if="currentChromeTab?.url">
            {{ currentChromeTab?.url }}
          </div>
          <div v-else class="col-10 ellipsis text-grey ">
            open or select a tab first...
          </div>
          <div class="col-2 text-bold ">
            Title
          </div>
          <div class="col-10 ellipsis ">
            {{ currentChromeTab?.title }}
          </div>

        </div>
      </div>
    </div>


    <div class="row q-ma-sm" style="max-width:390px;">
      <div class="col-3">

      </div>
      <div class="col-9 text-right">
        <q-btn :disable="noCurrentTabGiven()" label="Save" size="12px" @click="saveFromPanel()"
               style="width:120px"></q-btn>
      </div>
    </div>
    <div class="col-12">
      &nbsp;
    </div>
    <div class="row q-ma-sm" style="max-width:390px;">
      <div class="col-12">

        <PanelTabList  :tabs="tabsStore.getCurrentTabset?.tabs || []"/>
      </div>

    </div>
  </div>

</template>

<script lang="ts" setup>

import NavigationService from "src/services/NavigationService";
import {ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset} from "src/models/Tabset";
import ChromeApi from "src/services/ChromeApi";
import {useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {uid, useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useUiStore} from "stores/uiStore";
import TabsetsSelectorWidget from "components/widgets/TabsetsSelectorWidget.vue";
import PanelTabList from "components/layouts/PanelTabList.vue";

const {inBexMode} = useUtils()

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)

console.log("adding listener")

if (inBexMode()) {
  chrome.runtime.onMessage.addListener(({name, data}) => {
    console.log("got message", name)
    if (name === 'current-tabset-id-change') {
      const tsId = data.tabsetId
      console.log("hier", useTabsStore().getCurrentTabset, tsId)
      useTabsStore().selectCurrentTabset(tsId)
    }
  })
} else {
  useRouter().push("/start")
}

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    console.log("checking", currentChromeTabs.value[0].url)
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})
watchEffect(() => {
  console.log("tabset id", useTabsStore().currentTabsetId)
})
watchEffect(() => {
  console.log("currentChromeTab", useTabsStore().currentChromeTab)
  currentChromeTab.value = useTabsStore().currentChromeTab
})

watchEffect(() => {
  if (useTabsStore().tabsets) {
    tabsetNameOptions.value = _.map([...useTabsStore().tabsets.values()], (ts: Tabset) => {
      return {
        label: ts.name,
        value: ts.id
      }
    })
    if (tabsetNameOptions.value.length > 0) {
      tabsetName.value = tabsetNameOptions.value[0]
    }
  }
})

const openExtensionTab = () => {
  const extensionUrl = chrome.runtime.getURL('www/index.html#/start')
  NavigationService.openOrCreateTab(extensionUrl)
}

if (inBexMode()) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

const saveFromPanel = () => {
  const currentChromeTab = useTabsStore().currentChromeTab
  console.log("saving from panel...", currentChromeTab)
  if (currentChromeTab && tabsStore.getCurrentTabset) {
    const tabsetId = tabsStore.getCurrentTabset.id // tabsetName.value['value' as keyof object]
    // useTabsetService().addToTabsetId(tabset['value' as keyof object], new Tab(uid(), currentChromeTab))
    const useTS = useTabsetService().getTabset(tabsetId)
    if (useTS) {
      useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab), useTS))
    }
  }
}

const save = () => {
  console.log("saving...", tabsetName.value['value' as keyof object])
  if (tabsetName.value && tabsetName.value['value' as keyof object]) {
    //console.log("tabId", currentChromeTabs.value[0]?.id)
    // @ts-ignore
    chrome.scripting.executeScript({
      target: {tabId: currentChromeTabs.value[0]?.id, allFrames: true},
      args: [currentChromeTabs.value[0], tabsetName.value['value' as keyof object]],
      func: (tabId: number, tabsetId: string) => {
        //console.log("calling func", tabId, tabsetId)
        //if (window.getSelection()?.anchorNode && window.getSelection()?.anchorNode !== null) {
        const msg = {
          msg: "addTabToTabset",
          tabId: tabId,
          tabsetId: tabsetId
        }
        //console.log("sending message", msg)
        chrome.runtime.sendMessage(msg, function (response) {
          console.log("created new tab in current tabset:", response)
        });
        // }
      }
    }, (result: any) => {
      console.log("result", result)
      //window.close()
    });

  }

}

const createClip = () => {
  if (currentChromeTabs.value[0]?.id) {
    ChromeApi.executeClippingJS(currentChromeTabs.value[0]?.id)
  }
}

const navigate = (target: string) => router.push(target)

const tabsets = (): Tabset[] => {
  let tabsets = [...tabsStore.tabsets.values()]
  return tabsets
}


const addFirstTabset = () => $q.dialog({
  component: NewTabsetDialog, componentProps: {
    setEmptyByDefault: useUiStore().newTabsetEmptyByDefault,
    firstTabset: true,
    fromPanel: true
  }
})

const noCurrentTabGiven = () => !(currentChromeTab.value && currentChromeTab.value.url && currentChromeTab.value.url.trim().length >= 0)


</script>
