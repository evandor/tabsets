<template>
  <!-- SidePanelPage2 -->
  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 50px">

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
           v-if="useTabsetsStore().tabsets.size === 0 && !useUiStore().appLoading">
        <div class="row items-center text-grey-5">how to start?</div>
        <div style="min-width:300px;border:1px solid #efefef;border-radius:5px">
          <q-list>
            <q-item clickable @click="useUiStore().startButtonAnimation('newTabset')">
              <q-item-section avatar>
                <q-btn outline label="..." color="primary" size="sm"/>
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
                <q-item-label caption>Click here to activate more features</q-item-label>
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

      <div v-if="useTabsetsStore().tabsets.size > 0"
           class="row q-ma-none q-pa-none items-start darkInDarkMode brightInBrightMode">

        <div class="col-9 q-ml-md q-mt-sm">
          <div class="text-caption">Collection</div>
          <div class="text-body1 text-bold cursor-pointer" @click="router.push('/sidepanel/collections')">
            {{ currentTabset?.name }}
          </div>
        </div>
        <div class="col text-right vertical-middle q-mt-md">


          <SpecialUrlAddToTabsetComponent
            v-if="currentChromeTab && currentTabset"
            @button-clicked="(args:object) => handleButtonClicked(currentTabset!, undefined, args)"
            :currentChromeTab="currentChromeTab"
            :tabset="currentTabset"
          />

          <q-icon name="more_vert" size="sm" class="cursor-pointer"/>
          <SidePanelPageContextMenu v-if="currentTabset" :tabset="currentTabset as Tabset"/>
        </div>

        <div class="col-12">
          <hr style="height:1px;border:none;background-color: #efefef;">
        </div>

        <!-- list of tabs, assuming here we have at least one tabset-->
        <SidePanelPageTabList v-if="currentTabset"
                              :indent="calcFolders(currentTabset as Tabset)?.length > 0"
                              :tabsCount="useTabsetService().tabsToShow(currentTabset as Tabset)?.length"
                              :tabset="tabsetForTabList(currentTabset as Tabset)"/>

      </div>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">

      <FirstToolbarHelper
        :showSearchBox="showSearchBox">

        <template v-slot:title v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
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

import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import _ from "lodash"
import {Tabset, TabsetStatus} from "src/tabsets/models/Tabset";
import {useRouter} from "vue-router";
import {useUtils} from "src/core/services/Utils";
import {LocalStorage, uid, useQuasar} from "quasar";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useUiStore} from "src/ui/stores/uiStore";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import TabsetService from "src/tabsets/services/TabsetService";
import Analytics from "src/core/utils/google-analytics";
import {useAuthStore} from "stores/authStore";
import {useSuggestionsStore} from "src/suggestions/stores/suggestionsStore";
import {TITLE_IDENT} from "boot/constants";
import AppService from "src/app/AppService";
import SidePanelToolbarButton from "src/core/components/SidePanelToolbarButton.vue";
import {useI18n} from 'vue-i18n'
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import NewTabsetDialog from "src/tabsets/dialogues/NewTabsetDialog.vue";
import SidePanelPageContextMenu from "pages/sidepanel/SidePanelPageContextMenu.vue";
import SidePanelPageTabList from "src/tabsets/layouts/SidePanelPageTabList.vue";
import {Tab} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {AddTabToTabsetCommand} from "src/tabsets/commands/AddTabToTabsetCommand";
import SpecialUrlAddToTabsetComponent from "src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue";
import {useWindowsStore} from "src/windows/stores/windowsStore";

const {t} = useI18n({locale: navigator.language, useScope: "global"})

const {inBexMode} = useUtils()

const $q = useQuasar()
const router = useRouter()
const uiStore = useUiStore()

const showSearchBox = ref(false)
const tabsets = ref<Tabset[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

function updateOnlineStatus(e: any) {
  const {type} = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {

  if (!LocalStorage.getItem('ui.sidepanel.newLayout')) {
    router.push("/sidepanel")
  }

  window.addEventListener('keypress', checkKeystroke);

  window.addEventListener("offline", (e) => updateOnlineStatus(e));
  window.addEventListener("online", (e) => updateOnlineStatus(e));

  if (!useAuthStore().isAuthenticated) {
    //router.push("/authenticate")
  } else {
    Analytics.firePageViewEvent('SidePanelPage', document.location.href);
  }
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  if (useUiStore().tabsFilter) {
    console.log("filtering:::", useUiStore().tabsFilter)
  }
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

function determineTabsets() {
  return _.sortBy(
    _.filter([...useTabsetsStore().tabsets.values()] as Tabset[],
      (ts: Tabset) => ts.status !== TabsetStatus.DELETED
        && ts.status !== TabsetStatus.HIDDEN &&
        ts.status !== TabsetStatus.ARCHIVED),
    getTabsetOrder, ["asc"]);
}

watchEffect(() => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = _.sortBy(
      _.filter([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
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
    // console.log("tabsets:", tabsets.value)
  } else {
    tabsets.value = determineTabsets()
  }
})

watchEffect(() => {
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})


function inIgnoredMessages(message: any) {
  return message.msg === "html2text" ||
    message.msg === "captureThumbnail" ||
    message.msg === "capture-annotation" ||
    message.name === "reload-spaces" ||
    // message.name === "window-updated" ||
    message.msg === "html2links"
}

if (inBexMode()) {
  // seems we need to define these listeners here to get the matching messages reliably
  // these messages are created by triggering events in the mainpanel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(" <<< received message", message)
    if (inIgnoredMessages(message)) {
      return true
    }
    if (message.name === 'current-tabset-id-change') {
      if (message.ignore) {
        return true
      }
      const tsId = message.data.tabsetId
      useTabsetsStore().selectCurrentTabset(tsId)
    } else if (message.name === 'feature-activated') {
      useFeaturesStore().activateFeature(message.data.feature)
    } else if (message.name === "text-selection") {
      console.log("message", message)
    } else if (message.name === "feature-deactivated") {
      useFeaturesStore().deactivateFeature(message.data.feature)
    } else if (message.name === "tabsets-imported") {
      useSpacesStore().reload()
      useTabsetService().init()
      // TODO reload
    } else if (message.name === "tab-being-dragged") {
      useUiStore().draggingTab(message.data.tabId, null as unknown as any)
    } else if (message.name === "note-changed") {
      // TODO needed?
      //const tabset = useTabsetsStore().getTabset(message.data.tabsetId) as Tabset
      if (message.data.notebookId) {
        console.log("updating notebook/tabset", message.data.notebookId, message.data.tabsetId)
        useTabsetService().reloadTabset(message.data.tabsetId)
        // const res = useTabsetsStore().getTabAndTabsetId(message.data.noteId)
        // //.then((res: TabAndTabsetId | undefined) => {
        // if (res) {
        //   const note = res.tab
        //   note.title = message.data.tab.title
        //   note.description = message.data.tab.description
        //   note.longDescription = message.data.tab.longDescription
        // }
        // useTabsetService().saveTabset(tabset)
        //    })
      } else {
        console.log("adding tab", message.data.tab)
        //tabset.tabs.push(message.data.tab)
        //useTabsetService().saveTabset(tabset)
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
      // } else if (message.name === "mark-tabset-deleted") {
      //   TabsetService.markAsDeleted(message.data.tabsetId)
    } else if (message.name === "tabset-renamed") {
      TabsetService.rename(message.data.tabsetId, message.data.newName, message.data.newColor)
    } else if (message.name === "progress-indicator") {
      if (message.percent) {
        uiStore.setProgress(message.percent)
        // uiStore.progressLabel = message.label
      }
      if (message.status === "done") {
        uiStore.progress = undefined
        // uiStore.progressLabel = undefined
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
        useTabsetsStore().getCurrentTabset?.id
      useTabsetService().reloadTabset(tabsetId)
    } else if (message.name === 'reload-application') {
      AppService.restart("restarted=true")
      // } else if (message.name === 'restore-tabset') {
      //   debugger
      //   useCommandExecutor().execute(new RestoreTabsetCommand(message.data.tabsetId, message.data.label, true))
    } else {
      console.log("got unmatched message", message)
    }
    return true
  })
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

const toolbarTitle = (tabsets: Tabset[]): string => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const spaceName = useSpacesStore().space ? useSpacesStore().space.label : t('no_space_selected')
    return tabsets.length > 6 ?
      spaceName + ' (' + tabsets.length.toString() + ')' :
      spaceName
  }
  const title: string = LocalStorage.getItem(TITLE_IDENT) || ('My Tabsets' + stageIdentifier())
  return tabsets.length > 6 ? title + ' (' + tabsets.length.toString() + ')' : title
}


const stageIdentifier = () => process.env.TABSETS_STAGE !== 'PRD' ? ' (' + process.env.TABSETS_STAGE + ')' : ''


const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().getCurrentTabset?.id,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true
    }
  })
}

const calcFolders = (tabset: Tabset): Tabset[] => {
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
    if (af) {
      return af
    }
  }
  return tabset
}

const addCurrentTab = async () => {
  let queryOptions = {active: true, lastFocusedWindow: true};
  try {
    let [currentTab] = await chrome.tabs.query(queryOptions);
    if (currentTab) {
      await useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(new Tab(uid(), currentTab)))
    }
  } catch (err: any) {
    console.warn(err)
  }
}

const alreadyAdded = (): boolean => {
  const currentChromeTabUrl = useTabsStore2().currentChromeTab?.url
  if (currentChromeTabUrl) {
    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      return _.find(currentTabset.tabs, (t: Tab) => t.url === currentChromeTabUrl) !== undefined
    }
  }
  return false
}

const handleButtonClicked = async (tabset: Tabset, folder?: Tabset, args?: object) => {
  console.log(`button clicked: tsId=${tabset.id}, folderId=${folder?.id}, args=${JSON.stringify(args)}`)
}

</script>
