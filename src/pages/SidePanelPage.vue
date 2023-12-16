<template>

  <q-page style="padding-top: 50px">
    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none q-pa-none">

      <div class="row q-ma-md q-pa-md" v-if="suggestTabsetImport()">
        <q-btn class="q-px-xl" dense label="import Tabset" color="warning" @click="testShare()"/>
      </div>

      <q-list dense
              class="rounded-borders q-ma-none q-pa-none" :key="tabset.id"
              v-for="(tabset,index) in tabsets">
        <q-expansion-item v-if="showTabset(tabset as Tabset)"
                          header-class="q-ma-none q-pa-none q-pr-md bg-grey-2"
                          :header-style="headerStyle(tabset as Tabset)"
                          group="tabsets"
                          :default-opened="tabsStore.tabsets.size === 1"
                          switch-toggle-side
                          expand-icon-toggle
                          dense-toggle
                          v-model="selected_model[tabset.id]"
                          @update:model-value="val => updateSelectedTabset(tabset.id, val, index)"
                          expand-separator>

          <template v-slot:header>
            <q-item-section
              class="q-mt-xs"
              @mouseover="hoveredTabset = tabset.id"
              @mouseleave="hoveredTabset = undefined">
              <q-item-label :class="tabsStore.currentTabsetId === tabset.id ? 'text-bold text-underline' : ''">
                <q-icon v-if="tabset.status === TabsetStatus.FAVORITE"
                        color="warning"
                        name="push_pin"
                        style="position: relative;top:-2px">
                  <q-tooltip class="tooltip">This tabset is pinned for easier access</q-tooltip>
                </q-icon>
                {{ tabset.name }}
                <span v-if="tabset.type === TabsetType.DYNAMIC">
                  <q-icon name="o_label" color="warning">
                    <q-tooltip class="tooltip">Dynamic Tabset, listing all tabsets containing this tag</q-tooltip>
                  </q-icon>
                </span>
              </q-item-label>
              <q-item-label class="text-caption text-grey-5">
                {{ tabsetCaption(useTabsetService().tabsToShow(tabset as Tabset), tabset.window) }}
              </q-item-label>
              <q-item-label v-if="tabset.sharedId" class="q-mb-xs"
                            @mouseover="hoveredPublicLink = true"
                            @mouseleave="hoveredPublicLink = false">
                <q-icon style="position: relative;top:-2px;left:-2px"
                        @click="shareTabsetPubliclyDialog(tabset as Tabset, tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0)"
                        name="ios_share"
                        class="q-ma-none q-pa-none q-mr-xs"
                        :class="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0 ? 'cursor-pointer' : ''"
                        :color="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0 ? 'warning' : 'primary'">
                  <q-tooltip class="tooltip" v-if="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0">
                    This tabset is shared but has been changed in the meantime. You need to re-publish.
                  </q-tooltip>
                  <q-tooltip v-else class="tooltip">This tabset is shared</q-tooltip>
                </q-icon>
                <span class="text-caption cursor-pointer text-grey-7" @click="openPublicShare(tabset.id)">open shared page</span>
                <q-icon
                  v-show="hoveredPublicLink"
                  class="q-ml-sm cursor-pointer"
                  name="content_copy" color="primary" @click="copyPublicShareToClipboard(tabset.id)">
                  <q-tooltip class="tooltip-small">Copy the Link to your Clipboard</q-tooltip>
                </q-icon>
                <!--                <q-icon-->
                <!--                  v-show="hoveredPublicLink"-->
                <!--                  class="q-ml-sm cursor-pointer"-->
                <!--                  name="open_in_browser" color="primary" @click="openElectronLink(tabset.id)">-->
                <!--                  <q-tooltip class="tooltip-small">Copy the Electron Link to your Clipboard</q-tooltip>-->
                <!--                </q-icon>-->
              </q-item-label>
            </q-item-section>

            <q-item-section side
                            @mouseover="hoveredTabset = tabset.id"
                            @mouseleave="hoveredTabset = undefined">
              <q-item-label>
                <q-icon
                  v-if="showAddTabButton(tabset as Tabset, currentChromeTab)"
                  @click.stop="saveInTabset(tabset.id)"
                  class="q-mr-none"
                  name="o_bookmark_add"
                  :class="alreadyInTabset() ? '':'cursor-pointer'"
                  :color="alreadyInTabset() ? 'grey-5': tsBadges.length > 0 ? 'accent':'warning'"
                  size="xs"
                  data-testid="saveInTabsetBtn">
                </q-icon>
                <span
                  v-if="!alreadyInTabset() && showAddTabButton(tabset as Tabset, currentChromeTab) && tsBadges.length > 0"
                  style="color: grey;font-size: 7px;position: relative;top:-2px;left:-11px;">{{
                    tsBadges.length
                  }}</span>
                <q-tooltip class="tooltip-small" v-if="alreadyInTabset()">
                  Tab is already contained in tabset '{{ tabset.name }}'
                </q-tooltip>
                <q-tooltip class="tooltip-small" v-else-if="tsBadges.length > 0">
                  {{ tooltipAlreadyInOtherTabsets(tabset.name) }}
                </q-tooltip>
                <q-tooltip class="tooltip-small" v-else>
                  Add current Tab to '{{ tabset.name }}'
                </q-tooltip>

              </q-item-label>
            </q-item-section>

            <q-item-section side
                            @mouseover="hoveredTabset = tabset.id"
                            @mouseleave="hoveredTabset = undefined">
              <q-item-label>
                <q-icon class="cursor-pointer" name="more_horiz" color="accent" size="16px"/>
                <SidePanelPageContextMenu :tabset="tabset as Tabset"/>
              </q-item-label>
            </q-item-section>
          </template>

          <div class="q-ma-none q-pa-none">

            <template v-if="tabset.page">
              <SidePanelTabsetDescriptionPage
                :tabsetId="tabset.id"
                :tabsetDesc="tabset.page as Object"/>
            </template>

            <SidePanelPageTabList
              v-if="tabsetExpanded.get(tabset.id)"
              :tabset="tabset as Tabset"
            />

          </div>
        </q-expansion-item>


      </q-list>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper
        :showSearchBox="showSearchBox">

        <template v-slot:title v-if="permissionsStore && permissionsStore.hasFeature(FeatureIdent.SPACES)">
          <div class="text-subtitle1 text-black" @click.stop="router.push('/sidepanel/spaces')">
            <q-btn flat color="black" no-caps :label="toolbarTitle(tabsets as Tabset[])"/>
            <q-tooltip :delay="1000" class="tooltip">Click to open List of all Spaces</q-tooltip>
          </div>
        </template>
        <template v-slot:title v-else>
          <div class="text-subtitle1 text-black">
            {{ toolbarTitle(tabsets as Tabset[]) }}
          </div>
        </template>

      </FirstToolbarHelper>
      <!--      <SecondToolbarHelper/>-->

    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {openURL, scroll, uid, useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useUiStore} from "src/stores/uiStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useSpacesStore} from "src/stores/spacesStore";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import {FeatureIdent} from "src/models/AppFeature";
import SidePanelPageContextMenu from "pages/sidepanel/SidePanelPageContextMenu.vue";
import {useWindowsStore} from "src/stores/windowsStore";
import TabsetService from "src/services/TabsetService";
import Analytics from "src/utils/google-analytics";
import {useAuthStore} from "stores/auth";
import {useDB} from "src/services/usePersistenceService";
import getScrollTarget = scroll.getScrollTarget;
import {useBookmarksStore} from "stores/bookmarksStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import SidePanelPageTabList from "components/layouts/SidePanelPageTabList.vue";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {SuggestionState} from "src/models/Suggestion";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import SidePanelTabsetDescriptionPage from "pages/sidepanel/SidePanelTabsetDescriptionPage.vue";
import {PUBLIC_SHARE_URL} from "boot/constants";
import ShareTabsetPubliclyDialog from "components/dialogues/ShareTabsetPubliclyDialog.vue";

const {setVerticalScrollPosition} = scroll

const {inBexMode} = useUtils()

const $q = useQuasar()
const router = useRouter()

const tabsStore = useTabsStore()
const permissionsStore = usePermissionsStore()
const uiStore = useUiStore()
const showSearchBox = ref(false)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const tabsetExpanded = ref<Map<string, boolean>>(new Map())
const hoveredPublicLink = ref(false)

// https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
interface SelectionObject {
  [key: string]: boolean
}

const selected_model = ref<SelectionObject>({})
const hoveredTabset = ref<string | undefined>(undefined)
const tabsets = ref<Tabset[]>([])
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)
const selectedTab = ref<Tab | undefined>(undefined)
const windowName = ref<string | undefined>(undefined)
const windowId = ref<number | undefined>(undefined)
const tsBadges = ref<object[]>([])

onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);
  if (!useAuthStore().isAuthenticated) {
    router.push("/authenticate")
  } else {
    Analytics.firePageViewEvent('SidePanelPage', document.location.href);
  }
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

watchEffect(() => {
  //console.log(" >>> change in getSelectedTab", useUiStore().getSelectedTab)
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  //console.log("hier11", currentTabset.value?.page)
})


watchEffect(() => {
  windowName.value = useWindowsStore().currentWindowName
})

watchEffect(() => {
  if (currentChromeTab.value?.url) {
    const url = currentChromeTab.value.url
    const tabsetIds = useTabsetService().tabsetsFor(url)
    tsBadges.value = []
    //created.value = undefined
    _.forEach(tabsetIds, tsId => {
      tsBadges.value.push({
        label: TabsetService.nameForTabsetId(tsId),
        tabsetId: tsId,
        encodedUrl: btoa(url || '')
      })
    })
  }
})

const scrollToElement = (el: any, delay: number) => {
  if (!el) {
    return
  }
  setTimeout(() => {
    const target = getScrollTarget(el)
    const offset = el.offsetTop
    const duration = 200
    setVerticalScrollPosition(target, offset - 120, duration)
  }, delay);

}

const updateSelectedTabset = (tabsetId: string, open: boolean, index: number | undefined = undefined) => {
  //console.log("updated...", tabsetId, open, Object.keys(tabsetExpanded.value))
  tabsetExpanded.value.set(tabsetId, open)
  if (open) {
    if (index) {
      scrollToElement(document.getElementsByClassName("q-expansion-item")[index], 300)
    }

    useUiStore().tabsetsExpanded = true

    useCommandExecutor()
      .execute(new SelectTabsetCommand(tabsetId, useSpacesStore().space?.id))
      .then(() => {
        const promises: Promise<any>[] = []
        //console.log("selecteded tabset > ", tabsetId)
        const selectedTabset = useTabsStore().getTabset(tabsetId)
        if (selectedTabset) {
          handleHeadRequests(selectedTabset)
        }
      })

  } else {
    useUiStore().tabsetsExpanded = false
  }
}

watchEffect(() => {
  // should trigger if currentTabsetId is changed from "the outside"
  const currentTabsetId = useTabsStore().currentTabsetId
  selected_model.value = {}
  selected_model.value[currentTabsetId] = true
  tabsetExpanded.value.set(currentTabsetId, true)
  const index = _.findIndex(tabsets.value as Tabset[], (ts: Tabset) => ts.id === currentTabsetId)
  scrollToElement(document.getElementsByClassName("q-expansion-item")[index], 300)
  useUiStore().tabsetsExpanded = true
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
  const windowId = useWindowsStore().currentWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

watchEffect(() => {
  if (useUiStore().tabsFilter) {
    console.log("filtering:::", useUiStore().tabsFilter)
  }
})

watchEffect(() => {
  if (useTabsStore().tabsets) {
    //console.log(" >>> change in tabsets...")
    tabsetNameOptions.value = _.map([...useTabsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
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
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

const getTabsetOrder =
  [
    function (o: Tabset) {
      return o.status === TabsetStatus.FAVORITE ? 0 : 1
    },
    function (o: Tabset) {
      return o.name?.toLowerCase()
    }
  ]

watchEffect(() => {
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = _.sortBy(
      _.filter([...tabsStore.tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return ts.status !== TabsetStatus.DELETED &&
          ts.status !== TabsetStatus.HIDDEN &&
          ts.status !== TabsetStatus.ARCHIVED
      }),
      getTabsetOrder, ["asc"])
  } else {
    tabsets.value = _.sortBy(
      _.filter([...tabsStore.tabsets.values()] as Tabset[],
        (ts: Tabset) => ts.status !== TabsetStatus.DELETED
          && ts.status !== TabsetStatus.HIDDEN &&
          ts.status !== TabsetStatus.ARCHIVED),
      getTabsetOrder, ["asc"])
  }
})


function inIgnoredMessages(message: any) {
  return message.msg === "html2text" ||
    message.msg === "captureThumbnail" ||
    message.msg === "capture-annotation" ||
    message.msg === "html2links"
}

if ($q.platform.is.chrome) {
  if (inBexMode()) {
    // seems we need to define these listeners here to get the matching messages reliably
    // these messages are created by triggering events in the mainpanel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (inIgnoredMessages(message)) {
        return true
      }
      if (message.name === 'current-tabset-id-change') {
        console.log(" >>> got message", message)
        if (message.ignore) {
          return true
        }
        const tsId = message.data.tabsetId
        useTabsStore().selectCurrentTabset(tsId)
      } else if (message.name === 'feature-activated') {
        usePermissionsStore().addActivateFeature(message.data.feature)
        if (message.data.feature === 'help') {
          useTabsetService().reloadTabset("HELP")
        } else if (message.data.feature === 'bookmarks') {
          usePermissionsStore().load()
            .then(() => {
              useBookmarksStore().init()
              useBookmarksStore().loadBookmarks()
            })
        }
      } else if (message.name === "feature-deactivated") {
        usePermissionsStore().removeActivateFeature(message.data.feature)
      } else if (message.name === "tabsets-imported") {
        useSpacesStore().reload()
        useTabsetService().init(useDB(undefined).db)
        // TODO reload
      } else if (message.name === "tab-being-dragged") {
        useUiStore().draggingTab(message.data.tabId, null as unknown as any)
      } else if (message.name === "note-changed") {
        // TODO needed?
        const tabset = useTabsetService().getTabset(message.data.tabsetId) as Tabset
        if (message.data.noteId) {
          console.log("updating note", message.data.noteId)
          const res = useTabsStore().getTabAndTabsetId(message.data.noteId)
          //.then((res: TabAndTabsetId | undefined) => {
          if (res) {
            const note = res.tab
            note.title = message.data.tab.title
            note.description = message.data.tab.description
            note.longDescription = message.data.tab.longDescription
          }
          useTabsetService().saveTabset(tabset)
          //    })
        } else {
          console.log("adding tab", message.data.tab)
          tabset.tabs.push(message.data.tab)
          useTabsetService().saveTabset(tabset)
        }
      } else if (message.name === "tab-added") {
        // hmm - getting this twice...
        console.log(" > got message '" + message.name + "'", message)
        useTabsetService().reloadTabset(message.data.tabsetId)
        //updateSelectedTabset(message.data.tabsetId, true)
      } else if (message.name === "tab-deleted") {
        useTabsetService().reloadTabset(message.data.tabsetId)
      } else if (message.name === "tabset-added") {
        useTabsetService().reloadTabset(message.data.tabsetId)
      } else if (message.name === "mark-tabset-deleted") {
        TabsetService.markAsDeleted(message.data.tabsetId)
      } else if (message.name === "tabset-renamed") {
        TabsetService.rename(message.data.tabsetId, message.data.newName, message.data.newColor)
      } else if (message.name === "progress-indicator") {
        if (message.percent) {
          uiStore.progress = message.percent
          uiStore.progressLabel = message.label
        }
        if (message.status === "done") {
          uiStore.progress = undefined
          uiStore.progressLabel = undefined
        }
        sendResponse("ui store progress set to " + uiStore.progress)
      } else if (message.name === "detail-level-changed") {
        console.log("setting list detail level to ", message.data.level)
        useUiStore().setListDetailLevel(message.data.level)
      } else if (message.name === "detail-level-perTabset-changed") {
        console.log("setting list detail perTabset level to ", message.data.level)
        useUiStore().showDetailsPerTabset = message.data.level
      } else if (message.name === "fullUrls-changed") {
        console.log("setting fullUrls to ", message.data.value)
        useUiStore().setShowFullUrls(message.data.value)
      } else if (message.name === "reload-suggestions") {
        console.log("reload-suggestions message received")
        useSuggestionsStore().loadSuggestionsFromDb()
      } else if (message.name === "reload-tabset") {
        console.log("reload-tabset message received")
        const tabsetId = message.data.tabsetId ?
          message.data.tabsetId :
          useTabsetService().getCurrentTabset()?.id
        useTabsetService().reloadTabset(tabsetId)
        // } else if (message.name === "toggle-cs-iframe") {
        //   if (message.data.close) {
        //     chrome.tabs.sendMessage(message.data.tabId, "cs-iframe-close")
        //   } else {
        //     chrome.tabs.sendMessage(message.data.tabId, "cs-iframe-open")
        //   }
      } else {
        console.log("got unmatched message", message)
      }
      return true
    })
  }
} else {
  //useRouter().push("/start")
}

if (inBexMode() && chrome) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

async function handleHeadRequests(selectedTabset: Tabset) {
  //selectedTabset.tabs.forEach((t: Tab) => {
  for (const t of selectedTabset.tabs) {
    if (t.url && !t.url.startsWith("chrome")) {
      // console.log("checking HEAD", t.url)
      try {
        const response = await fetch(t.url, {
          method: 'HEAD',
          cache: 'no-cache',
//          mode: 'no-cors',
          redirect: 'manual'
        })
        //console.log("got response", t.url)
        const oldLastModified = t.httpLastModified

        t.httpStatus = response.status
        t.httpContentType = response.headers.get("content-type") || 'unknown'
        t.httpLastModified = response.headers.get("Last-Modified") || 'unknown'
        t.httpCheckedAt = new Date().getTime()

        if (response.status !== 200) {
          // console.log(`checking HEAD found status ${response.status} for url ${t.url}`)
        }

        try {
          if (t.httpLastModified && oldLastModified) {
            if (Date.parse(t.httpLastModified) > Date.parse(oldLastModified)) {
              t.httpInfo = "UPDATED"
            }
          }
        } catch (err) {
        }
      } catch (error) {
        console.log('got a Problem: \n', error);
        //t.httpError = error.toString()
        //return Promise.resolve()
      }
    }
  }
  useTabsetService().saveTabset(selectedTabset)
}

const tabsetCaption = (tabs: Tab[], window: string) => {
  const filter = useUiStore().tabsFilter
  if (!tabs) {
    return '-'
  }
  let caption = ''
  if (!filter || filter.trim() === '') {
    caption = tabs.length + ' tab' + (tabs.length === 1 ? '' : 's')
  } else {
    caption = tabs.length + ' tab' + (tabs.length === 1 ? '' : 's') + ' (filtered)'
  }
  if (window && window !== 'current' && usePermissionsStore().hasFeature(FeatureIdent.WINDOW_MANAGEMENT)) {
    caption = caption + " - opens in: " + window
  }
  return caption
}

function checkKeystroke(e: KeyboardEvent) {
  if (useUiStore().ignoreKeypressListener()) {
    return
  }
  if (e.key === '/') {
    // TODO does not work properly yet
    //showSearchBox.value = true
    // e.preventDefault()
    // // @ts-ignore
    // searchBox.value.focus()
    // search.value = ''
  }
}

const showTabset = (tabset: Tabset) => !useUiStore().tabsFilter ?
  true :
  (useUiStore().tabsFilter === '' || useTabsetService().tabsToShow(tabset).length > 0)

const toolbarTitle = (tabsets: Tabset[]) => {
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES)) {
    const spaceName = useSpacesStore().space ? useSpacesStore().space.label : 'no space selected'
    return tabsets.length > 6 ?
      spaceName + ' (' + tabsets.length.toString() + ')' :
      spaceName
  }
  let text = tabsets.length > 6 ? 'My Tabsets (' + tabsets.length.toString() + ')' : 'My Tabsets'
  if (windowName.value) {
    text = text + " [" + windowName.value + "]"
  }
  return text
}

const headerStyle = (tabset: Tabset) => {
  const tabsetOpened = _.findIndex([...tabsetExpanded.value.keys()],
    (key: string) => (key !== null) && tabsetExpanded.value.get(key)) >= 0
  let style = tabsetExpanded.value.get(tabset.id) ?
    'border:0 solid grey;border-top-left-radius:4px;border-top-right-radius:4px;' :
    tabsetOpened ?
      'border:0 solid grey;border-radius:4px;opacity:30%;' :
      'border:0 solid grey;border-radius:4px;'
  if (tabset.color && usePermissionsStore().hasFeature(FeatureIdent.COLOR_TAGS)) {
    style = style + 'border-left:4px solid ' + tabset.color
  } else {
    style = style + 'border-left:4px solid #f5f5f5'
  }
  return style
}

const showAddTabButton = (tabset: Tabset, currentChromeTab: chrome.tabs.Tab) => {
  return inBexMode() &&
    tabset.type !== TabsetType.DYNAMIC &&
    currentChromeTab &&
    currentChromeTab.url &&
    currentChromeTab.url !== 'chrome://newtab/' &&
    currentChromeTab.url.indexOf('/www/index.html#/mainpanel/notes/') < 0 &&
    currentChromeTab.url !== '' &&
    tabsStore.currentTabsetId === tabset.id
  //isCurrentTab()
}

const saveInTabset = (tabsetId: string) => {
  if (alreadyInTabset()) {
    return
  }
  const useTS = useTabsetService().getTabset(tabsetId)
  if (useTS) {
    useCommandExecutor().execute(new AddTabToTabsetCommand(new Tab(uid(), currentChromeTab.value), useTS))
  } else {
    console.warn("expected to find tabsetId", tabsetId)
  }
}

const alreadyInTabset = () => {
  if (currentChromeTab.value?.url && tabsStore.getCurrentTabset) {
    return useTabsetService().urlExistsInCurrentTabset(currentChromeTab.value.url)
  }
  return false
}

const tooltipAlreadyInOtherTabsets = (tabsetName: string) => {
  const tabsetList = _.join(_.map(tsBadges.value, (b: any) => b['label'] as keyof object), ", ")
  return "The current Tab is already contained in " +
    tsBadges.value.length + " other Tabsets: " + tabsetList + ". Click to add " +
    "it to '" + tabsetName + "' as well."
}

const openPublicShare = (tabsetId: string) => {
  const ts = useTabsetService().getTabset(tabsetId)
  if (ts && ts.sharedId) {
    openURL(getPublicTabsetLink(ts))
  }
}

const getPublicTabsetLink = (ts: Tabset) => {
  let image = "https://tabsets.web.app/favicon.ico"
  if (ts && ts.sharedId) {
    return PUBLIC_SHARE_URL + "#/pwa/imp/" + ts.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharedBy || 'n/a') + "&d=" + ts.sharedAt
  }
  return image
}

const openElectronLink = (tabsetId: string) => {
  const ts = useTabsetService().getTabset(tabsetId)
  if (ts && ts.sharedId) {
    const link = "electron-tabsets://#/pwa/imp/" + ts.sharedId + "?n=" + btoa(ts.name)
    openURL(link)
  }

}
const copyPublicShareToClipboard = (tabsetId: string) => {
  const ts = useTabsetService().getTabset(tabsetId)
  if (ts && ts.sharedId) {
    const link = getPublicTabsetLink(ts)
    useCommandExecutor().executeFromUi(new CopyToClipboardCommand(link))
  }
}

const suggestTabsetImport = () => {
  const currentTabUrl = useTabsStore().currentChromeTab?.url
  if (currentTabUrl?.startsWith("https://shared.tabsets.net/#/tabsets/")) {
    return true
  }
  return false
}

const testShare = () => {
  const shareData = {
    title: "MDN",
    text: "Learn web development on MDN!",
    url: "https://developer.mozilla.org",
  };
  console.log(navigator)
  if (navigator.canShare) {
    console.log(navigator.canShare())
    navigator.share(shareData).then((res) => console.log("res", res)).catch((err) => console.err(err))
  }
}

const shareTabsetPubliclyDialog = (tabset: Tabset, republish: boolean = false) => {
  $q.dialog({
    component: ShareTabsetPubliclyDialog,
    componentProps: {
      tabsetId: tabset.id,
      sharedId: tabset.sharedId,
      tabsetName: tabset.name,
      republish: republish
    }
  })
}

</script>

<style>

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.q-item__section--avatar {
  min-width: 46px !important;
  padding-right: 12px !important;
  margin-bottom: 14px;
}
</style>
