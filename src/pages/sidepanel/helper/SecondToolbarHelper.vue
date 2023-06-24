<template>

  <q-toolbar
    class="text-primary $lightgrey q-pa-none q-pa-none bg-white" style="min-height:revert;">
    <!-- show progress or info messages if any -->
    <template v-if="progress">
      <div class="col-12"
           style="border-bottom: 1px dotted lightgray;border-left: 1px dotted lightgray;min-height:30px;">
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
    <!-- default second level toolbar -->
    <template v-else>
      <div class="col-8 q-pl-sm"
           style="border-bottom: 1px dotted lightgray;border-left: 1px dotted lightgray;border-radius:4px;min-height:30px;">
        <!--            <q-input borderless v-if="!progress && usePermissionsStore().hasFeature(FeatureIdent.NOTES)"-->
        <!--                     class="q-ma-xs"-->
        <!--                     style="height:20px;border: 1px dotted lightgray; border-radius: 3px;" v-model="dragTarget"/>-->
        <!--            <div v-else>&nbsp;</div>-->
        <TabsetsSelectorWidget :fromPanel="true" style="position: relative;top:3px"/>

      </div>
      <div class="col-4 text-right"
           style="border-bottom: 1px dotted lightgray;border-right: 1px dotted lightgray;border-radius:4px;min-height:30px">


        <!--              v-if="tabsStore.currentTabsetId !== '' && tabsStore.getTabset(tabsStore.currentTabsetId) && tabsStore.getCurrentTabset?.tabs.length > 0 && $q.screen.gt.xs"-->
        <q-btn
          v-if="tabsStore.getCurrentTabset?.tabs.length > 7"
          flat
          class="q-ma-none q-pa-xs cursor-pointer"
          style="width:20px;max-width:220px"
          size="11px"
          :text-color="useUiStore().tabsFilter ? 'warning' : 'primary'"
          :disable="tabsStore.getCurrentTabset?.type === TabsetType.DYNAMIC"
          icon="o_filter_alt">
          <q-popup-edit
            ref="popupEditRef"
            :model-value="useUiStore().tabsFilter" v-slot="scope"
            @save="(val, initial)=> setFilter(val)"
            @update:model-value="val => setFilter(  val)">
            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set">
              <template v-slot:append>
                <q-icon class="cursor-pointer" name="clear" @click="clearFilter()" size="xs"/>
              </template>
            </q-input>
          </q-popup-edit>
          <q-tooltip
            class="tooltip"
            :delay="200"
            anchor="center left" self="center right">
            {{ useUiStore().tabsFilter ? 'Filtering for "' + useUiStore().tabsFilter + '"' : 'Filter this tabset' }}
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
  </q-toolbar>

</template>

<script lang="ts" setup>

import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {ListDetailLevel, SidePanelView, useUiStore} from "stores/uiStore";
import {Tabset, TabsetType} from "src/models/Tabset";
import TabsetsSelectorWidget from "components/widgets/TabsetsSelectorWidget.vue";
import {useTabsStore} from "stores/tabsStore";
import {ref, watchEffect} from "vue";
import {Tab, UrlExtension} from "src/models/Tab";
import AddUrlDialog from "components/dialogues/AddUrlDialog.vue";
import {date, QInput, QPopupEdit, uid, useQuasar} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import NewSessionDialog from "components/dialogues/NewSessionDialog.vue";
import _ from "lodash";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";
import {useUtils} from "src/services/Utils";
import JsUtils from "src/utils/JsUtils";


const $q = useQuasar()

const {inBexMode, sanitize, sendMsg} = useUtils()

const tabsStore = useTabsStore()
const uiStore = useUiStore()

const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)
const selectedTab = ref<Tab | undefined>(undefined)
const dragTarget = ref('')
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const searching = ref(false)
const existingSession = ref(false)
const orderDesc = ref(false)
const popupEditRef = ref<QPopupEdit>()

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  currentChromeTab.value = useTabsStore().currentChromeTab
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
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

const createClip = () => {
  //console.log("creating clip", currentChromeTabs.value[0])
  if (tabsStore.currentChromeTab?.id) {
    ChromeApi.executeClippingJS(tabsStore.currentChromeTab.id)
  }
}

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

const showSorting = () => useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) && tabsStore.getCurrentTabs.length > 3

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


const setFilter = (newValue: string) => {
  console.log("filter", newValue)
  const useValue = newValue && newValue.trim().length > 0 ? newValue.trim() : undefined
  useUiStore().tabsFilter = useValue
  useUiStore().setHighlightTerm(useValue)
  JsUtils.runCssHighlight()
}
const clearFilter = () => {
  useUiStore().tabsFilter = undefined
  popupEditRef.value?.set()
  useUiStore().setHighlightTerm(undefined)
  JsUtils.runCssHighlight()
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
