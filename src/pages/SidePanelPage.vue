<template>

  <q-page>
<!--    <div class="fullimageBackground">-->
      <q-splitter class="window-height" style="position:absolute;left:0;right:0"
                  v-model="splitterModel"
                  separator-class="bg-grey-1"
                  horizontal
                  unit="px"
                  reverse>

        <template v-slot:before>

          <!-- first time -->
          <transition appear enter-active-class="fadeIn" style="transition-delay: 1.5s;transition: all 2s ease-in"
                      v-if="tabsStore.tabsets.size === 0">
            <div class="q-ma-none q-pa-md">
              <div class="row">
                <div class="col-12 text-h6">
                  Welcome to Tabsets Extension
                </div>
              </div>
              <div class="row q-mb-lg">
                <div class="col-12 text-subtitle1">
                  Bookmarks next generation
                </div>
              </div>

              <div class="row items-center">
                <div class="col-12 text-subtitle2 q-mb-md">
                  To get started:
                </div>
              </div>

              <q-btn class="text-primary"
                     outline
                     data-testid="createFirstTabsetBtn"
                     @click="addFirstTabset"
                     label="create your first tabset"></q-btn>

              <div class="row q-mt-lg">
                <div class="col-12 items-center q-mb-md">
                  This will create a new tabset containing some pre-chosen tabs.
                </div>
              </div>
            </div>
          </transition>

          <!-- we have at least one tabset -->
          <div v-else class="q-ma-none">

            <q-toolbar class="text-primary lightgrey">
              <div class="row fit">
                <q-toolbar-title>
                  <div class="row">
                    <div class="col-9">
                      <SearchWidget v-if="searching"
                                    :fromPanel="true"
                                    style="position: absolute; left:5px;top:5px;max-width:310px"/>
                      <TabsetsSelectorWidget v-else :fromPanel="true"/>
                    </div>
                    <div class="col-3 text-right">
                      <q-icon v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)"
                              class="q-ma-xs cursor-pointer" name="expand_less" size="16px" @click="showTabsets">
                        <q-tooltip class="tooltip">Manage Spaces</q-tooltip>
                      </q-icon>
                      <q-icon v-if="tabsStore.tabsets.size > 1"
                              class="q-ma-xs cursor-pointer" name="search" size="16px" @click="toggleSearch">
                        <q-tooltip class="tooltip">Search</q-tooltip>
                      </q-icon>
                      <q-icon v-if="useSettingsStore().isEnabled('dev')"
                              class="q-ma-xs cursor-pointer" name="filter_center_focus" size="16px" @click="createClip">
                        <q-tooltip class="tooltip">Create website clip</q-tooltip>
                      </q-icon>
                      <q-icon v-if="useSettingsStore().isEnabled('dev')"
                              class="q-ma-xs cursor-pointer" name="open_in_new" size="16px" @click="openExtensionTab">
                        <q-tooltip class="tooltip">Open Tabsets</q-tooltip>
                      </q-icon>
                    </div>
                  </div>
                </q-toolbar-title>
              </div>
            </q-toolbar>


            <div class="col-12">
              &nbsp
            </div>

            <div class="row q-ma-sm" v-if="tabsStore.getCurrentTabset">
              <div class="col-12">
                <SidePanelDynamicTabset v-if="tabsStore.getCurrentTabset?.type === TabsetType.DYNAMIC"
                                        :tabset="tabsStore.getCurrentTabset"/>
                <PanelTabList v-else
                              :tabs="tabsStore.getCurrentTabset.tabs"/>
              </div>
            </div>

            <transition v-else
                        appear enter-active-class="fadeIn" style="transition-delay: 1.5s">
              <div class="row q-ma-sm">
                <div class="col-12">
                  Add a new tabset to assign tabs to
                </div>
              </div>
            </transition>

          </div>

        </template>

        <template v-slot:after>
          <div v-if="tabFromChromeTab() && tabsStore.getCurrentTabset"
               class="row q-ma-sm q-mt-lg"
               :class="alreadyInTabset() ? 'bg-grey-1':'bg-yellow-1'"
               style="border:1px solid gray;border-radius: 5px">

            <div class="col-10">
              <q-list>
                <q-item
                  v-ripple
                  class="q-ma-none q-pa-xs">
                  <PanelTabListElementWidget header="Current Tab:" :tab="tabFromChromeTab()" :hideMenu="true"/>
                </q-item>
              </q-list>
            </div>
            <div class="col-2">
              <q-btn :disable="alreadyInTabset()" :label="alreadyInTabset() ? 'saved' :'save'" color="primary" flat
                     size="10px" @click="saveFromPanel()"></q-btn>
            </div>
          </div>

          <div v-else-if="selectedTab"
               class="row q-ma-sm q-mt-lg"
               :class="alreadyInTabset() ? 'bg-grey-1':'bg-yellow-1'"
               style="border:1px solid gray;border-radius: 5px">

            <div class="col-12">
              <q-list>
                <q-item
                  v-ripple
                  class="q-ma-none q-pa-xs">
                  <SidePanelTabListElementDetails :tab="selectedTab"/>
                </q-item>
              </q-list>
            </div>
          </div>
        </template>

      </q-splitter>
<!--    </div>-->
  </q-page>


</template>

<script lang="ts" setup>

import NavigationService from "src/services/NavigationService";
import {ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetType} from "src/models/Tabset";
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
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSettingsStore} from "stores/settingsStore";
import SearchWidget from "components/widgets/SearchWidget.vue";
import {useSpacesStore} from "stores/spacesStore";
import SidePanelTabListElementDetails from "components/widgets/SidePanelTabListElementDetails.vue";
import DynamicTabsetPageCards from "pages/DynamicTabsetPageCards.vue";
import SidePanelDynamicTabset from "components/layouts/sidepanel/SidePanelDynamicTabset.vue";

const {inBexMode} = useUtils()

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const show = ref(false)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const searching = ref(false)
// const chromeVersion = ref('unknown')
const splitterModel = ref(160)
const selectedTab = ref<Tab | undefined>(undefined)

console.log("adding listener")

const chromeVersion = (/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

watchEffect(() => {
  //console.log("watching", useUiStore().getSelectedTab)
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

if (inBexMode()) {
  chrome.runtime.onMessage.addListener(({name, data}) => {
    console.log("got message", name)
    if (name === 'current-tabset-id-change') {
      const tsId = data.tabsetId
      console.log("hier", useTabsStore().getCurrentTabset, tsId)
      useTabsStore().selectCurrentTabset(tsId)
    } else if (name === 'feature-activated') {
      console.log("message data", data)
      usePermissionsStore().initialize()
    } else if (name === 'feature-deactivated') {
      console.log("message data", data)
      usePermissionsStore().initialize()
    }
    return true
  })
} else {
  useRouter().push("/start")
}

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})
// watchEffect(() => {
//   console.log("tabset id", useTabsStore().currentTabsetId)
// })
watchEffect(() => {
  //console.log("currentChromeTab", useTabsStore().currentChromeTab)
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

const alreadyInTabset = () => {
  if (currentChromeTab.value?.url && tabsStore.getCurrentTabset) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
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

const tabFromChromeTab = () => currentChromeTab.value ? new Tab(uid(), currentChromeTab.value) : undefined

const showTabsets = () => router.push("/sidepanel/tabsets")

const toggleSearch = () => searching.value = !searching.value

</script>

<style scoped>


.fullimageBackground {
  height: 100vh;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.fullimageBackground::before {
  background-image: url('src/assets/bg.jpg');
  background-size: cover;
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.3;
}

.delayed-appear-enter-active {
  transition: all 3s ease-in;
  transition-delay: 3s
}

.delayed-appear-enter-from,
.delayed-appear-leave-to {
  opacity: 0
}

/* we will explain what these classes do next! */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
