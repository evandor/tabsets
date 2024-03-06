<template>

  <q-page style="padding-top: 50px">

    <div class="wrap" v-if="useUiStore().appLoading">
      <div class="loading">
        <div class="bounceball q-mr-lg"></div>
        <div class="text">{{ useUiStore().appLoading }}</div>
      </div>
    </div>

    <transition
      appear
      enter-active-class="animated fadeIn slower delay-5s"
      leave-active-class="animated fadeOut">
      <div class="wrap2"
           v-if="useTabsStore().tabsets.size === 0 && !useUiStore().appLoading">
        <div class="row items-center text-grey-5">how to start?</div>
        <div style="min-width:300px;border:1px solid #efefef;border-radius:5px">
          <q-list>
            <q-item clickable @click="useUiStore().startButtonAnimation('newTabset')">
              <q-item-section avatar>
                <SidePanelToolbarButton
                  icon="o_add_circle"
                  color="warning"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>New Tabset</q-item-label>
                <q-item-label caption>Click to create a new tabset</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="useUiStore().startButtonAnimation('settings')">
              <q-item-section avatar>
                <SidePanelToolbarButton
                  icon="o_settings"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>Settings</q-item-label>
                <q-item-label caption>Click here to assign your account</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="useUiStore().startButtonAnimation('bookmarks')">
              <q-item-section avatar>
                <SidePanelToolbarButton
                  icon="bookmark"
                  color="primary"/>
              </q-item-section>

              <q-item-section>
                <q-item-label>Bookmarks Manager</q-item-label>
                <q-item-label caption>Click to open the Bookmarks Manager</q-item-label>
              </q-item-section>
            </q-item>

          </q-list>
        </div>
      </div>
    </Transition>

    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none q-pa-none">
      <template v-if="suggestTabsetImport()">

        <InfoMessageWidget
          :probability="1"
          ident="sidePanelPage_importTabset">
          Whenever tabsets detects the <b>current tab to contain a new tabset</b>, it will suggest to import this
          set.<br>
          Importing will add the tabset to your existing ones.
        </InfoMessageWidget>

        <div class="row q-ma-sm q-pa-sm">
          <q-btn class="q-px-xl" dense label="Import Shared Tabset" color="warning" @click="importSharedTabset()">
            <q-tooltip class="tooltip-small">The Page in your current tab is a public Tabset which you can import into
              your own if you want.
            </q-tooltip>
          </q-btn>
        </div>
      </template>

      <q-list dense
              class="rounded-borders q-ma-none q-pa-none" :key="tabset.id"
              v-for="(tabset,index) in tabsets">
        <q-expansion-item v-if="showTabset(tabset as Tabset)"
                          header-class="q-ma-none q-pa-none q-pr-md"
                          :header-style="headerStyle(tabset as Tabset)"
                          group="tabsets"
                          :default-opened="tabsStore.tabsets.size === 1"
                          switch-toggle-side
                          expand-icon-toggle
                          dense-toggle
                          v-model="selected_model[tabset.id]"
                          @update:model-value="val => updateSelectedTabset(tabset.id, val, index)">

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
                {{ tabsetSectionName(tabset as Tabset) }}
                <span v-if="tabset.type === TabsetType.DYNAMIC">
                  <q-icon name="o_label" color="warning">
                    <q-tooltip class="tooltip">Dynamic Tabset, listing all tabsets containing this tag</q-tooltip>
                  </q-icon>
                </span>
              </q-item-label>
              <q-item-label class="text-caption text-grey-5">
                {{
                  tabsetCaption(useTabsetService().tabsToShow(tabset as Tabset), tabset.window, tabset.folders?.length)
                }}
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
                  id="foo"
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
                <q-tooltip v-else-if="useTabsStore().allTabsCount === 0"
                           transition-show="flip-right"
                           transition-hide="flip-left"
                           v-model="showAddCurrentTabTooltip"
                           class="tooltip-tour"
                           anchor="bottom right" self="top middle" :offset="[-26, 3 ]">
                  Click here
                  <q-icon name="keyboard_arrow_up"/>
                  to<br> add the current<br>tab to this tabset
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
                <q-icon class="cursor-pointer" name="more_horiz" size="16px"/>
                <SidePanelPageContextMenu :tabset="tabset as Tabset"
                                          @edit-header-description="toggleEditHeader(tabset as Tabset, index)"/>
              </q-item-label>
            </q-item-section>
          </template>

          <div class="q-ma-none q-pa-none">

            <template v-if="editHeaderDescription">
              <div class="row q-ma-none q-pa-md">
                <q-editor style="width:100%"
                          flat
                          v-model="headerDescription" min-height="5rem"
                          :definitions="{
                            save: {
                              tip: 'Save your work',
                              icon: 'save',
                              label: 'Save',
                              handler: saveTabsetDescription
                            },
                             pageNote: {
                              tip: 'Open page Note',
                              icon: 'open',
                              label: 'Open Page Note',
                              handler: openPageNote
                            }
                          }"
                          :toolbar="[
                            ['bold', 'italic', 'strike', 'underline'],
                            ['save','pageNote']
                          ]"
                          placeholder="Create a header description for your current tabset"/>
              </div>
            </template>
            <template v-else-if="tabset.headerDescription">
              <div class="row q-ma-sm q-pa-sm text-body2 darkInDarkMode brightInBrightMode"
                   style="border:1px solid #efefef;border-radius:3px;" v-html="tabset.headerDescription"></div>
            </template>

            <q-list>
              <q-item v-for="folder in calcFolders(tabset as Tabset)"
                      clickable
                      v-ripple
                      class="q-ma-none q-pa-sm greyBorderBottom"
                      @dragstart="startDrag($event, folder)"
                      @dragenter="enterDrag($event, folder)"
                      @dragover="overDrag($event, folder)"
                      @dragend="endDrag($event, folder)"
                      @drop="drop($event, folder)"
                      @click="selectFolder(tabset as Tabset, folder as Tabset)"
                      :key="'panelfolderlist_' + folder.id">

                <q-item-section class="q-mr-sm text-right" style="justify-content:start;width:30px;max-width:30px">
                  <div class="q-pa-none">
                    <q-icon name="o_folder" color="warning" size="sm"/>
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <div class="text-bold">
                      {{ folder.name }}
                    </div>
                  </q-item-label>
                  <q-item-label class="text-caption text-grey-5">
                    {{ folderCaption(folder) }}
                  </q-item-label>
                </q-item-section>

              </q-item>
            </q-list>

            <!-- the actual tabs -->
            <SidePanelPageTabList
              v-if="tabsetExpanded.get(tabset.id)"
              :tabsCount="useTabsetService().tabsToShow(tabset as Tabset).length"
              :tabset="tabsetForTabList(tabset as Tabset)"/>
            <!-- the actual tabs: end -->


          </div>
        </q-expansion-item>


      </q-list>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">

      <FirstToolbarHelper
        :showSearchBox="showSearchBox">

        <template v-slot:title v-if="permissionsStore && permissionsStore.hasFeature(FeatureIdent.SPACES)">
          <div class="text-subtitle1" @click.stop="router.push('/sidepanel/spaces')">
            <q-btn flat no-caps :label="toolbarTitle(tabsets as Tabset[])"/>
            <q-tooltip :delay="1000" class="tooltip">Click to open List of all Spaces</q-tooltip>
          </div>
        </template>
        <template v-slot:title v-else>
          <div class="text-subtitle1">
            {{ toolbarTitle(tabsets as Tabset[]) }}
          </div>
        </template>

      </FirstToolbarHelper>

    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, onUnmounted, ref, watch, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab, TabPreview} from "src/models/Tab";
import _, {result} from "lodash"
import {Tabset, TabsetSharing, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {LocalStorage, openURL, scroll, uid, useQuasar} from "quasar";
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
import {useAuthStore} from "stores/authStore";
import {useDB} from "src/services/usePersistenceService";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import SidePanelPageTabList from "components/layouts/SidePanelPageTabList.vue";
import {AddTabToTabsetCommand} from "src/domain/tabs/AddTabToTabset";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import ShareTabsetPubliclyDialog from "components/dialogues/ShareTabsetPubliclyDialog.vue";
import {FirebaseCall} from "src/services/firebase/FirebaseCall";
import getScrollTarget = scroll.getScrollTarget;
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import {TITLE_IDENT} from "boot/constants";
import AppService from "src/services/AppService";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {ExecutionResult} from "src/domain/ExecutionResult";
import SidePanelToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
import { useI18n } from 'vue-i18n'
const { t } = useI18n({locale: navigator.language, useScope: "global"})

const {setVerticalScrollPosition} = scroll

const {inBexMode, sanitize} = useUtils()

const $q = useQuasar()
const router = useRouter()

const tabsStore = useTabsStore()
const permissionsStore = usePermissionsStore()
const uiStore = useUiStore()
const showSearchBox = ref(false)
const showAddCurrentTabTooltip = ref(false)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const tabsetExpanded = ref<Map<string, boolean>>(new Map())
const hoveredPublicLink = ref(false)
const windowLocation = ref('---')
const user = ref<any>()
const headerDescription = ref<string>('')

// https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
interface SelectionObject {
  [key: string]: boolean
}

window.addEventListener("drop", (event) => {
  console.log("dropped", event)
});

const selected_model = ref<SelectionObject>({})
const hoveredTabset = ref<string | undefined>(undefined)
const tabsets = ref<Tabset[]>([])
const selectedTab = ref<Tab | undefined>(undefined)
const windowName = ref<string | undefined>(undefined)
const tsBadges = ref<object[]>([])
const editHeaderDescription = ref<boolean>(false)

const {handleSuccess, handleError} = useNotificationHandler()

function updateOnlineStatus(e: any) {
  const {type} = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);

  window.addEventListener("offline", (e) => updateOnlineStatus(e));
  window.addEventListener("online", (e) => updateOnlineStatus(e));

  windowLocation.value = window.location.href

  if (!useAuthStore().isAuthenticated) {
    //router.push("/authenticate")
  } else {
    Analytics.firePageViewEvent('SidePanelPage', document.location.href);
  }

  if (useTabsStore().allTabsCount === 0) {
    setTimeout(() => {
      showAddCurrentTabTooltip.value = true
      setTimeout(() => showAddCurrentTabTooltip.value = false, 4500)
    }, 1500)
  }

})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

watchEffect(() => {
  const ar = useAuthStore().useAuthRequest
  if (ar) {
    AppService.restart(ar)
  }
})

watchEffect(() => {
  if (useAuthStore().user) {
    user.value = useAuthStore().user
  }
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
  console.log("updated...", tabsetId, open, index, Object.keys(tabsetExpanded.value))
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
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
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

// watchEffect(() => {
//   progress.value = (uiStore.progress || 0.0) / 100.0
//   progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
// })

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
    message.name === "reload-spaces" ||
    message.name === "window-updated" ||
    message.msg === "html2links"
}

if ($q.platform.is.chrome) {
  if (inBexMode()) {
    // seems we need to define these listeners here to get the matching messages reliably
    // these messages are created by triggering events in the mainpanel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      //console.log(" <<< received message", message)
      if (inIgnoredMessages(message)) {
        return true
      }
      if (message.name === 'current-tabset-id-change') {
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
      } else if (message.name === 'reload-application') {
        AppService.restart("restarted=true")
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
        console.debug('got a Problem fetching url "' + t.url + '": \n', error)
        //t.httpError = error.toString()
        //return Promise.resolve()
      }
    }
  }
  useTabsetService().saveTabset(selectedTabset)
}

const tabsetCaption = (tabs: Tab[], window: string, foldersCount: number) => {
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
  if (foldersCount > 0) {
    caption = caption + ", " + foldersCount + " folder" + (foldersCount === 1 ? '' : 's')
  }
  if (window && window !== 'current') {
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
    const spaceName = useSpacesStore().space ? useSpacesStore().space.label : t('no_space_selected')
    return tabsets.length > 6 ?
      spaceName + ' (' + tabsets.length.toString() + ')' :
      spaceName
  }
  const title = LocalStorage.getItem(TITLE_IDENT) || ('My Tabsets' + stageIdentifier())
  return tabsets.length > 6 ? title + ' (' + tabsets.length.toString() + ')' : title
}

const headerStyle = (tabset: Tabset) => {
  const tabsetOpened: boolean = _.findIndex([...tabsetExpanded.value.keys()],
    (key: string) => (key !== null) && tabsetExpanded.value.get(key) !== undefined) >= 0
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
    currentChromeTab.url.indexOf('https://tabsets.web.app/?apiKey=') < 0 &&
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
    //return PUBLIC_SHARE_URL + "#/pwa/imp/" + ts.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharedBy || 'n/a') + "&d=" + ts.sharedAt
    return "https://us-central1-tabsets-backend-prd.cloudfunctions.net/app/share/preview/" + ts.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharedBy || 'n/a')
  }
  return image
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
  if (currentTabUrl?.startsWith("https://shared.tabsets.net/#/pwa/tabsets/")) {
    const urlSplit = currentTabUrl.split("/")
    const tabsetId = urlSplit[urlSplit.length - 1]
    console.log("tabsetId", tabsetId, useTabsetService().getTabset(tabsetId))
    return !useTabsetService().getTabset(tabsetId)
  }
  return false
}

const importSharedTabset = () => {
  const currentTabUrl = useTabsStore().currentChromeTab?.url
  if (currentTabUrl) {
    console.log("Importing", currentTabUrl)
    const urlSplit = currentTabUrl.split("/")
    const tabsetId = urlSplit[urlSplit.length - 1]
    FirebaseCall.get("/share/public/" + tabsetId + "?cb=" + new Date().getTime(), false)
      .then((res: any) => {
        const newTabset = res as Tabset
        newTabset.sharing = TabsetSharing.UNSHARED
        //_.forEach(newTabset.tabs, t => t.preview = TabPreview.THUMBNAIL)
        useTabsetService().saveTabset(newTabset)
        useTabsetService().reloadTabset(newTabset.id)
      })
  }
}

const selectFolder = (tabset: Tabset, folder: Tabset) => {
  console.log("selectiong folder", tabset.id, folder.id)
  tabset.folderActive = folder.id
  useTabsetService().saveTabset(tabset)
}


const calcFolders = (tabset: Tabset): Tabset[] => {
  //console.log("calcFolders", tabset)
  if (tabset.folderActive) {
    const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    if (af && af.folderParent) {
      return [new Tabset(af.folderParent, "..", [])].concat(af.folders)
    }
  }
  return tabset.folders
}


const tabsetForTabList = (tabset: Tabset) => {
  if (tabset.folderActive) {
    const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    //console.log("result af", af)
    if (af) {
      return af
    }
  }
  return tabset
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

const startDrag = (evt: any, folder: Tabset) => {
  console.log("start dragging", evt, folder)
  if (evt.dataTransfer) {
    evt.dataTransfer.dropEffect = 'all'
    evt.dataTransfer.effectAllowed = 'all'
    //evt.dataTransfer.setData('text/plain', tab.id)
    //useUiStore().draggingTab(tab.id, evt)
  }
  console.log("evt.dataTransfer.getData('text/plain')", evt.dataTransfer.getData('text/plain'))
}
const enterDrag = (evt: any, folder: Tabset) => {
  //console.log("enter drag", evt, folder)
}
const overDrag = (event: any, folder: Tabset) => {
  //console.log("enter drag", event, folder)
  event.preventDefault();
}
const endDrag = (evt: any, folder: Tabset) => {
  console.log("end drag", evt, folder)
}
const drop = (evt: any, folder: Tabset) => {
  console.log("drop", evt, folder)
  const tabToDrag = useUiStore().tabBeingDragged
  const tabset = useTabsetService().getCurrentTabset()
  if (tabToDrag && tabset) {
    console.log("tabToDrag", tabToDrag)
    const moveToFolderId = folder.id
    console.log("moveToFolderId", moveToFolderId)
    useTabsetService().moveTabToFolder(tabset, tabToDrag, moveToFolderId)
  }
}

const folderCaption = (folder: Tabset) =>
  (folder.name !== "..") ?
    folder.tabs.length + " tab" + (folder.tabs.length !== 1 ? 's' : '') :
    ""

const tabsetSectionName = (tabset: Tabset) => {
  if (!tabset.folderActive || tabset.id === tabset.folderActive) {
    return tabset.name
  }
  const activeFolder = useTabsetService().findFolder([tabset], tabset.folderActive)
  return tabset.name + (activeFolder ? " - " + activeFolder.name : "")
}

const toggleEditHeader = (tabset: Tabset, index: number) => {
  editHeaderDescription.value = !editHeaderDescription.value
  if (editHeaderDescription.value) {
    updateSelectedTabset(tabset.id, true, index)
    headerDescription.value = tabset.headerDescription || ''
  }
}

const saveTabsetDescription = () => {
  console.log("saving tabset", headerDescription.value, useTabsStore().currentTabsetId)
  const currentTs = useTabsStore().getCurrentTabset
  if (currentTs) {
    currentTs.headerDescription = sanitize(headerDescription.value)
    useTabsetService().saveCurrentTabset()
    editHeaderDescription.value = false
    headerDescription.value = ''
    handleSuccess(new ExecutionResult<string>('saved', 'saved'))
  } else {
    handleError("could not save description")
  }
}

const openPageNote = () => openURL(chrome.runtime.getURL("/www/index.html#/tabsets/" + useTabsStore().currentTabsetId + "?tab=page"))

const stageIdentifier = () => process.env.TABSETS_STAGE !== 'PRD' ? ' (' + process.env.TABSETS_STAGE + ')' : ''

</script>

<style lang="scss">

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

.welcome-tooltip-container {
  position: absolute;
  top: 30px;
  right: -50px;
  width: 140px;
  display: inline-block
}

.welcome-tooltip-container .tooltip {
  z-index: 10000;
  padding: 0 8px;
  background: white;
  color: #333;
  position: absolute;
  top: -17px;
  right: 0;
  border: 2px solid #FFBF46;
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 3px 3px 3px #ddd;
  animation: welcome-tooltip-pulse 1s ease-in-out infinite alternate
}

.welcome-tooltip-container .tooltip p {
  margin: 15px 0;
  line-height: 1.5
}

.welcome-tooltip-container .tooltip * {
  vertical-align: middle
}

.welcome-tooltip-container .tooltip::after {
  content: " ";
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 10px 12.5px 0 12.5px;
  border-color: #FFBF46 transparent transparent transparent;
  position: absolute;
  top: -10px;
  right: 35px;
  transform: rotate(180deg)
}

$width: 25px;
$height: 25px;

$bounce_height: 30px;

body {
  position: relative;
  width: 100%;
  height: 100vh;
}

.wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.wrap2 {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.text {
  //color: #000066;
  font-size: 24px;
  display: inline-block;
  margin-left: 5px;
}

.bounceball {
  position: relative;
  display: inline-block;
  height: 37px;
  width: $width;

  &:before {
    position: absolute;
    content: '';
    display: block;
    top: 0;
    width: $width;
    height: $height;
    border-radius: 50%;
    background-color: #fbae17;
    transform-origin: 50%;
    animation: bounce 500ms alternate infinite ease;
  }
}

@keyframes bounce {
  0% {
    top: $bounce_height;
    height: 5px;
    border-radius: 60px 60px 20px 20px;
    transform: scaleX(2);
  }
  35% {
    height: $height;
    border-radius: 50%;
    transform: scaleX(1);
  }
  100% {
    top: 0;
  }
}

</style>
