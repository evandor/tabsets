<template>

  <q-page>

    <div class="q-ma-none">
      <q-toolbar class="text-primary lightgrey q-pa-none q-pl-sm q-pr-xs">
        <q-toolbar-title>
          <div class="row q-ma-none q-pa-none">
            <div v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)"
                 class="col-8 q-ma-none q-pa-none">
              <SearchWidget v-if="searching"
                            :fromPanel="true"
                            style="position: absolute; left:5px;top:5px;max-width:240px"/>
              <div class="column q-ma-none q-pa-none" v-else>
                <div class="col q-ma-none q-pa-none text-black cursor-pointer"
                     @click="router.push('/sidepanel/spaces')"
                     style="font-size: 12px">
                  {{ useSpacesStore().space ? useSpacesStore().space.label : 'no space selected' }}
                </div>
                <div class="col q-ma-none q-pa-none">
                  <TabsetsSelectorWidget class="q-ma-none q-pa-none" :fromPanel="true"/>
                </div>
              </div>
            </div>
            <div v-else class="col-8 q-ma-none q-pa-none">
              <SearchWidget v-if="searching"
                            :fromPanel="true"
                            style="position: absolute; left:5px;top:5px;max-width:240px"/>
              <TabsetsSelectorWidget v-else
                                     style="position: absolute; left:5px;top:14px"
                                     :fromPanel="true"/>
            </div>
            <div class="col-4 text-right">

              <q-btn v-if="tabsStore.tabsets.size > 1"
                     icon="search"
                     flat
                     class="q-ma-none q-pa-xs cursor-pointer"
                     style="max-width:20px"
                     size="11px"
                     @click="toggleSearch">
                <q-tooltip class="tooltip">Search</q-tooltip>
              </q-btn>

              <!--                  <q-btn-->
              <!--                    icon="o_add"-->
              <!--                    flat-->
              <!--                    class="q-ma-none q-pa-xs cursor-pointer"-->
              <!--                    style="max-width:20px"-->
              <!--                    size="11px"-->
              <!--                    @click="openNewTabsetDialog()">-->
              <!--                    <q-tooltip class="tooltip">Add new Tabset</q-tooltip>-->
              <!--                  </q-btn>-->

              <q-btn
                v-if="tabsStore.tabsets.size > 1"
                icon="o_keyboard_double_arrow_right"
                flat
                class="q-ma-none q-pa-xs cursor-pointer"
                style="max-width:20px"
                size="11px"
                @click="openTabsetPage()">
                <q-tooltip class="tooltip">Open this Tabset as Standalone page</q-tooltip>
              </q-btn>

            </div>
          </div>
        </q-toolbar-title>
      </q-toolbar>

      <!-- second toolbar line -->
      <div class="row q-ma-none q-pa-none">
        <!-- show progress or info messages if any -->
        <template v-if="progress">
          <div class="col-12" style="border-bottom: 1px dotted lightgray;border-left: 1px dotted lightgray">
            <q-linear-progress size="20px" :value="progress" color="primary">
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="accent" :label="progressLabel"/>
              </div>
            </q-linear-progress>
            <q-input borderless v-if="!progress && usePermissionsStore().hasFeature(FeatureIdent.NOTES)"
                     class="q-ma-xs"
                     style="height:20px;border: 1px dotted lightgray; border-radius: 3px;" v-model="dragTarget"/>
          </div>
        </template>
        <template v-else>
          <div class="col-6" style="border-bottom: 1px dotted lightgray;border-left: 1px dotted lightgray">
            <q-input borderless v-if="!progress && usePermissionsStore().hasFeature(FeatureIdent.NOTES)"
                     class="q-ma-xs"
                     style="height:20px;border: 1px dotted lightgray; border-radius: 3px;" v-model="dragTarget"/>
          </div>
          <div class="col-6 text-right"
               style="border-bottom: 1px dotted lightgray;border-right: 1px dotted lightgray">


            <!--              v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId) && tabsStore.getCurrentTabset?.tabs.length > 0 && $q.screen.gt.xs"-->
            <q-btn
              v-if="tabsStore.getCurrentTabset?.tabs.length > 7"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="width:20px;max-width:220px"
              size="11px"
              :text-color="useUiStore().tabsFilter ? 'accent' : 'primary'"
              :disable="tabsStore.getCurrentTabset?.type === TabsetType.DYNAMIC"
              :label="useUiStore().tabsFilter"
              icon="o_filter_alt">
              <q-popup-edit :model-value="useUiStore().tabsFilter" v-slot="scope"
                            @update:model-value="val => setFilter(  val)">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
              </q-popup-edit>
              <q-tooltip
                class="tooltip"
                :delay="200"
                anchor="center left" self="center right">
                Filter this tabset
              </q-tooltip>
            </q-btn>

            <q-btn v-if="showSorting()"
                   flat
                   size="10px"
                   class="q-ma-none q-pa-xs cursor-pointer"
                   style="max-width:20px"
                   text-color="primary"
                   @click="toggleSorting()"
                   outline
                   icon="o_sort">
              <q-tooltip class="tooltip">Toggle through sorting</q-tooltip>
            </q-btn>

            <q-btn v-if="tabsStore.getCurrentTabset?.tabs.length > 0"
                   :icon="getDetailLevelIcon()"
                   flat
                   size="10px"
                   class="q-ma-none q-pa-xs cursor-pointer"
                   style="max-width:20px"
                   text-color="primary"
                   @click="toggleListDetailLevel()">
              <q-tooltip class="tooltip">Toggle the detail level for the tabs</q-tooltip>
            </q-btn>

            <q-btn v-if="usePermissionsStore().hasFeature(FeatureIdent.SESSIONS)"
                   flat
                   style="max-width:20px"
                   size="10px"
                   class="q-ma-none q-pa-xs cursor-pointer"
                   :color="existingSession ? (tabsStore.getCurrentTabset?.type === TabsetType.SESSION ? 'red':'grey-5') :'primary'"
                   :icon="existingSession ? 'o_stop_circle':'o_play_circle'"
                   @click="toggleSessionState">
              <q-tooltip class="tooltip" v-if="existingSession">Stop Session</q-tooltip>
              <q-tooltip class="tooltip" v-else>Start new Session</q-tooltip>
            </q-btn>

            <q-btn v-if="usePermissionsStore().hasFeature(FeatureIdent.WEBSITE_CLIP) && webClipActive()"
                   icon="filter_center_focus"
                   flat
                   class="q-ma-none q-pa-xs cursor-pointer"
                   style="max-width:20px"
                   size="10px"
                   @click="createClip">
              <q-tooltip class="tooltip">{{ createWebsiteClipTooltip() }}</q-tooltip>
            </q-btn>
            <q-btn v-if="usePermissionsStore().hasFeature(FeatureIdent.WEBSITE_CLIP) && !webClipActive()"
                   icon="filter_center_focus"
                   color="grey-5"
                   flat
                   class="q-ma-none q-pa-xs cursor-pointer"
                   style="max-width:20px"
                   size="10px">
              <q-tooltip class="tooltip">cannot create web clip for this tab</q-tooltip>
            </q-btn>

          </div>

        </template>
      </div>
    </div>

    <q-splitter class="window-height" style="position:absolute;left:0;right:0"
                v-model="splitterModel"
                separator-class="bg-grey-1"
                horizontal
                unit="px">

      <!-- list of tabs -->
      <template v-slot:after>

        <!-- assuming here we have at least one tabset -->
        <div class="q-ma-none">


          <!--          <div class="text-caption q-ma-md" v-if="tabsStore.getCurrentTabset?.tabs.length === 0 && tabsStore.getCurrentTabset?.type === TabsetType.DEFAULT">-->
          <!--            <q-img src="cat.png"/>-->
          <!--          </div>-->

          <div class="text-caption q-ma-md"
               v-if="tabsStore.getCurrentTabset?.tabs.length === 0 && tabsStore.getCurrentTabset?.type === TabsetType.DEFAULT">
            Start browsing and add the tabs you like to this tabset
          </div>

          <div class="row q-ma-none q-pa-none" v-if="tabsStore.getCurrentTabset">
            <div class="col-12 q-ma-none q-pa-none q-pt-lg">

              <!--              <q-btn label="send" @click="sendMessage()"></q-btn>-->


              <SidePanelDynamicTabset v-if="tabsStore.getCurrentTabset?.type === TabsetType.DYNAMIC"
                                      :tabset="tabsStore.getCurrentTabset"/>
              <PanelTabList v-else
                            :tabs="filteredTabs()"/>


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

      <!-- selected tab or current tab from chrome -->
      <template v-slot:before>
        <SidePanelTabInfo/>
      </template>

    </q-splitter>
  </q-page>

</template>

<script lang="ts" setup>

import NavigationService from "src/services/NavigationService";
import {ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab, UrlExtension} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetType} from "src/models/Tabset";
import ChromeApi from "src/services/ChromeApi";
import {useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {date, uid, useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {ListDetailLevel, useUiStore} from "src/stores/uiStore";
import TabsetsSelectorWidget from "components/widgets/TabsetsSelectorWidget.vue";
import PanelTabList from "components/layouts/PanelTabList.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import SearchWidget from "components/widgets/SearchWidget.vue";
import {useSpacesStore} from "src/stores/spacesStore";
import SidePanelDynamicTabset from "components/layouts/sidepanel/SidePanelDynamicTabset.vue";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";
import NewSessionDialog from "components/dialogues/NewSessionDialog.vue";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import JsUtils from "src/utils/JsUtils";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";
import {useLogsStore} from "stores/logsStore";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const uiStore = useUiStore()
const show = ref(false)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const searching = ref(false)
const existingSession = ref(false)
const orderDesc = ref(false)
const logs = ref<object[]>([])
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)

const splitterModel = ref(160)
const selectedTab = ref<Tab | undefined>(undefined)
const dragTarget = ref('')

const chromeVersion = (/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

watchEffect(() => {
  existingSession.value = _.filter([...tabsStore.tabsets.values()], (ts: Tabset) => ts.type === TabsetType.SESSION).length > 0
})

watchEffect(() => {
  logs.value = useLogsStore().logs
})

function inIgnoredMessages(message: any) {
  return message.msg === "html2text" ||
    message.msg === "html2links" ||
    message.name === "zero-shot-classification" ||
    message.msg === "init-ai-module";
}

if (inBexMode()) {
  // seems we need to define these listeners here to get the matching messages reliably
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (inIgnoredMessages(message)) {
      return true
    }
    if (message.name === 'current-tabset-id-change') {
      const tsId = message.data.tabsetId
      useTabsStore().selectCurrentTabset(tsId)
    } else if (message.name === 'feature-activated' || message.name === "feature-deactivated") {
      usePermissionsStore().initialize()
    } else if (message.name === "tabsets-imported") {
      useSpacesStore().reload()
      useTabsetService().init()
      // TODO reload
    } else if (message.name === "tab-being-dragged") {
      useUiStore().draggingTab(message.data.tabId, null as unknown as any)
    } else if (message.name === "tab-changed") {
      const tabset = useTabsetService().getTabset(message.data.tabsetId) as Tabset
      // replace tab (seems necessary !?) TODO
      tabset.tabs = _.map(tabset.tabs, (t: Tab) => (t.id === message.data.tab.id) ? message.data.tab : t)
      useTabsetService().saveTabset(tabset)
        .then((res) => {
          console.log("saved tabset", tabset)
        })
        .catch((err) => {
          console.error("got error " + err)
        })
    } else if (message.name === "progress-indicator") {
      //console.log(" > got message '" + message.name + "'", message)
      if (message.percent) {
        uiStore.progress = message.percent
        uiStore.progressLabel = message.label
      }
      if (message.status === "done") {
        uiStore.progress = undefined
        uiStore.progressLabel = undefined
      }
      sendResponse("ui store progress set to " + uiStore.progress)
    } else {
      console.log("got unmatched message", message)
    }
    return true
  })
} else {
  useRouter().push("/start")
}

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
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


watchEffect(() => {
  if (dragTarget.value.trim() === "") {
    return
  }
  try {
    const url = new URL(dragTarget.value)
    $q.dialog({component: AddUrlDialog, componentProps: {providedUrl: url.toString()}})
  } catch (err) {
    // not an url, create a "fake" url and save as note
    if (tabsStore.getCurrentTabset) {
      const id = uid()
      const url = chrome.runtime.getURL('www/index.html') + "#/mainpanel/notes/" + id
      const text = sanitize(dragTarget.value.trim())

      const titleCandidate = text.split(".")[0]
      let title = "note " + date.formatDate(new Date().getTime(), 'DD.MM.YYYY HH:mm')
      // console.log("titleCandidate", titleCandidate.length, titleCandidate)
      // if (titleCandidate.length > 0 && titleCandidate.length < 60) {
      //   title = titleCandidate
      // }

      const chromeTab = ChromeApi.createChromeTabObject(title, url,
        "https://img.icons8.com/?size=512&id=86843&format=png")
      const tab = new Tab(id, chromeTab)
      tab.description = text

      if (inBexMode()) {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, (openTabs) => {
          if (openTabs.length > 0) {
            const currentChromeTab = openTabs[0]
            tab.chromeTab.favIconUrl = currentChromeTab.favIconUrl
            if (currentChromeTab.url) {
              tab.history.push(currentChromeTab.url)
            }
            tab.tags.push("Note")
            tab.extension = UrlExtension.NOTE
            //tab.description =  tab.description + openTabs[0].url + "\n\n"
          }
          // @ts-ignore
          useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab, tabsStore.getCurrentTabset))
        })
      } else {
        useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab, tabsStore.getCurrentTabset))
      }

    } else {
      console.log("no current tabset")
    }
  }
  dragTarget.value = ''
})

const openTabsetPage = () => {
  const tabsetId = tabsStore.getCurrentTabset?.id
  if (tabsetId) {
    const extensionUrl = chrome.runtime.getURL('www/index.html#/mainpanel/tabsets/' + tabsetId)
    NavigationService.openOrCreateTab(extensionUrl)
  }
  router.push("/sidepanel/spaces")
}

if (inBexMode()) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}


const setFilter = (newValue: string) => {
  console.log("filter", newValue)
  const useValue = newValue && newValue.trim().length > 0 ? newValue.trim() : undefined
  useUiStore().tabsFilter = useValue
  useUiStore().setHighlightTerm(useValue)
  JsUtils.runCssHighlight()
}

const createClip = () => {
  //console.log("creating clip", currentChromeTabs.value[0])
  if (tabsStore.currentChromeTab?.id) {
    ChromeApi.executeClippingJS(tabsStore.currentChromeTab.id)
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

const toggleSearch = () => searching.value = !searching.value

const onDrop = (evt: any) => console.log("dropped", evt)

const toggleSessionState = () => {
  console.log("hier", existingSession)
  existingSession ? stopSession() : startSession()
}

const startSession = () => $q.dialog({
  component: NewSessionDialog,
  componentProps: {replaceSession: false, inSidePanel: true}
})

const stopSession = () => {
  const tabsetWithSession = _.filter([...tabsStore.tabsets.values()], (ts: Tabset) => ts.type === TabsetType.SESSION)
  console.log("tabsetWithSession", tabsetWithSession)
  if (tabsetWithSession && tabsetWithSession.length > 0) { // should be one at most
    useCommandExecutor().executeFromUi(new StopSessionCommand(tabsetWithSession[0]))
  }
}
const replaceSession = () => $q.dialog({component: NewSessionDialog, componentProps: {replaceSession: true}})

const createWebsiteClipTooltip = () => {
  //return "Create Website Clip for tab " + currentTabs.value[0].chromeTab.url
  return "Create Website Clip for tab " + tabsStore.currentChromeTab?.url
}

const webClipActive = () => tabsStore.currentChromeTab

function filteredTabs(): Tab[] {
  //console.log("got", props.tabset.tabs)
  const filter = useUiStore().tabsFilter
  if (filter && filter.trim() !== '') {
    return _.orderBy(_.filter(tabsStore.getCurrentTabset?.tabs, (t: Tab) => {
        return (t.chromeTab.url || '')?.indexOf(filter) >= 0 ||
          (t.chromeTab.title || '')?.indexOf(filter) >= 0 ||
          t.description?.indexOf(filter) >= 0
      })
      , getOrder(), [orderDesc.value ? 'desc' : 'asc'])
  }
  return _.orderBy(tabsStore.getCurrentTabset?.tabs, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
}

const toggleSorting = () => useCommandExecutor().executeFromUi(new ToggleSortingCommand(tabsStore.currentTabsetId))

const toggleOrder = () => orderDesc.value = !orderDesc.value

const showSorting = () => tabsStore.getCurrentTabs.length > 3

function getOrder() {
  if (tabsStore.getCurrentTabset) {
    switch (tabsStore.getCurrentTabset.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.chromeTab.url?.replace("https://", "").replace("http://", "").toUpperCase()
      case 'alphabeticalTitle':
        return (t: Tab) => t.chromeTab.title?.toUpperCase()
      default:
        return (t: Tab) => 1
    }
    return (t: Tab) => 1
  }
}

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      fromPanel: true
    }
  })
}

const getDetailLevelIcon = () => {
  switch (useUiStore().listDetailLevel) {
    case ListDetailLevel.LARGE:
      return "crop_portrait"
    case ListDetailLevel.MEDIUM:
      return "crop_16_9"
    default:
      return "crop_7_5"
  }
}

const toggleListDetailLevel = () => {
  switch (useUiStore().listDetailLevel) {
    case ListDetailLevel.LARGE:
      useUiStore().setListDetailLevel(ListDetailLevel.MEDIUM)
      break;
    case ListDetailLevel.MEDIUM:
      useUiStore().setListDetailLevel(ListDetailLevel.SMALL)
      break;
    default:
      useUiStore().setListDetailLevel(ListDetailLevel.LARGE)
  }
}


</script>

<style scoped>


.delayed-appear-enter-active {
  transition: all 2s ease-in;
  transition-delay: 1s
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
