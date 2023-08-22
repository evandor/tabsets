<template>

  <q-page style="padding-top: 50px">
    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none q-pa-none">
      <q-list dense
              class="rounded-borders q-ma-none q-pa-none" :key="tabset.id"
              v-for="(tabset,index) in tabsets">
        <q-expansion-item v-if="showTabset(tabset as Tabset)"
                          header-class="q-ma-none q-pa-none q-pr-md bg-grey-2"
                          :header-style="tabsetExpanded.get(tabset.id) ?
                            'border:0 solid grey;border-top-left-radius:4px;border-top-right-radius:4px' :
                            'border:0 solid grey;border-radius:4px'"
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
                @mouseover="hoveredTabset = tabset.id"
                @mouseleave="hoveredTabset = undefined">
              <q-item-label :class="tabsStore.currentTabsetId === tabset.id ? 'text-bold' : ''"
                            @dblclick="focusOnTabset(tabset as Tabset)">
                <q-icon v-if="tabset.status === TabsetStatus.FAVORITE"
                        color="warning"
                        name="push_pin"
                        style="position: relative;top:-2px">
                  <q-tooltip class="tooltip">This tabset is pinned for easier access</q-tooltip>
                </q-icon>
                <q-icon v-if="tabset.sharedId"
                        :color="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0 ? 'warning' : 'primary'"
                        name="share"
                        style="position: relative;top:-2px">
                  <q-tooltip class="tooltip" v-if="tabset.sharing.toString().toLowerCase().indexOf('_outdated') >= 0">
                    This tabset is shared but has been changed in the meantime. You need to re-publish.
                  </q-tooltip>
                  <q-tooltip v-else class="tooltip">This tabset is shared</q-tooltip>
                </q-icon>
                {{ tabset.name }}
                <span v-if="tabset.type === TabsetType.DYNAMIC">
                  <q-icon name="o_label" color="warning">
                    <q-tooltip class="tooltip">Dynamic Tabset, listing all tabsets containing this tag</q-tooltip>
                  </q-icon>
                </span>
              </q-item-label>
              <q-item-label class="text-caption text-grey-5">
                {{ tabsetCaption(filteredTabs(tabset as Tabset), tabset.window) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side
                            @mouseover="hoveredTabset = tabset.id"
                            @mouseleave="hoveredTabset = undefined">
              <q-icon class="cursor-pointer" name="more_horiz" color="black" size="16px"/>
              <SidePanelPageContextMenu :tabset="tabset as Tabset"/>
            </q-item-section>

          </template>


          <div class="q-ma-none q-pa-none">

            <div class="q-ma-none" v-if="inBexMode()">
              <SidePanelTabInfo :tabsetId="tabset.id"/>
            </div>

            <PanelTabList
                v-if="tabsetExpanded.get(tabset.id)"
                :tabsetType="tabset.type"
                :tabs="filteredTabs(tabset as Tabset)"/>

          </div>
        </q-expansion-item>


      </q-list>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper
          :showSearchBox="showSearchBox">

        <template v-slot:title v-if="permissionsStore && permissionsStore.hasFeature(FeatureIdent.SPACES)">
          <div class="text-subtitle1 text-black">
            {{ toolbarTitle(tabsets as Tabset[]) }}
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
import {scroll, uid, useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import {useUiStore} from "src/stores/uiStore";
import PanelTabList from "components/layouts/PanelTabList.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useSpacesStore} from "src/stores/spacesStore";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import {FeatureIdent} from "src/models/AppFeature";
import SidePanelPageContextMenu from "pages/sidepanel/SidePanelPageContextMenu.vue";
import {DynamicTabSourceType} from "src/models/DynamicTabSource";
import {useWindowsStore} from "../stores/windowsStores";
import TabsetService from "src/services/TabsetService";
import Analytics from "src/utils/google-analytics";
import {useAuthStore} from "stores/auth";
import {PlaceholdersType} from "src/models/Placeholders";
import getScrollTarget = scroll.getScrollTarget;

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
  console.log("updated...", tabsetId, open, Object.keys(tabsetExpanded.value))
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
        _.filter([...tabsStore.tabsets.values()], (ts: Tabset) => {
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
        _.filter([...tabsStore.tabsets.values()],
            (ts: Tabset) => ts.status !== TabsetStatus.DELETED
                && ts.status !== TabsetStatus.HIDDEN &&
                ts.status !== TabsetStatus.ARCHIVED),
        getTabsetOrder, ["asc"])
  }
})


function inIgnoredMessages(message: any) {
  return message.msg === "html2text" ||
      message.msg === "html2links" ||
      message.msg === "websiteQuote" ||
      message.name === "recogito-annotation-created"
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
      } else if (message.name === "feature-deactivated") {
        usePermissionsStore().removeActivateFeature(message.data.feature)
      } else if (message.name === "tabsets-imported") {
        useSpacesStore().reload()
        useTabsetService().init()
        // TODO reload
      } else if (message.name === "tab-being-dragged") {
        useUiStore().draggingTab(message.data.tabId, null as unknown as any)
      } else if (message.name === "tab-changed") {
        const tabset = useTabsetService().getTabset(message.data.tabsetId) as Tabset
        if (message.data.noteId) {
          console.log("updating note", message.data.noteId)
          useTabsStore().getTab(message.data.noteId)
              .then((res: object | undefined) => {
                if (res) {
                  const note = res['tab' as keyof object] as Tab
                  note.title = message.data.tab.title
                  note.description = message.data.tab.description
                  note.longDescription = message.data.tab.longDescription
                }
                useTabsetService().saveTabset(tabset)
              })
        } else {
          console.log("adding tab", message.data.tab)
          tabset.tabs.push(message.data.tab)
          useTabsetService().saveTabset(tabset)
        }
      } else if (message.name === "tab-added") {
        // hmm - getting this twice...
        console.log(" > got message '" + message.name + "'", message)
        useTabsetService().reloadTabset(message.data.tabsetId)
      } else if (message.name === "tab-deleted") {
        useTabsetService().reloadTabset(message.data.tabsetId)
      } else if (message.name === "tabset-added") {
        useTabsetService().reloadTabset(message.data.tabsetId)
      } else if (message.name === "mark-tabset-deleted") {
        TabsetService.markAsDeleted(message.data.tabsetId)
      } else if (message.name === "tabset-renamed") {
        TabsetService.rename(message.data.tabsetId, message.data.newName)
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
      } else {
        console.log("got unmatched message", message)
      }
      return true
    })
  } else {
    //useRouter().push("/start")
  }
}

const filteredTabs = (tabset: Tabset): Tab[] => {
  if (tabset.type === TabsetType.DYNAMIC &&
      tabset.dynamicTabs && tabset.dynamicTabs.type === DynamicTabSourceType.TAG) {
    const results: Tab[] = []
    //console.log("checking", tabset.dynamicTabs)
    const tag = tabset.dynamicTabs?.config['tags' as keyof object][0]
    //console.log("using tag", tag)
    _.forEach([...tabsStore.tabsets.values()], (tabset: Tabset) => {
      _.forEach(tabset.tabs, (tab: Tab) => {
        if (tab.tags?.indexOf(tag) >= 0) {
          results.push(tab)
        }
      })
    })
    //return _.orderBy(results, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
    return results
  }
  let tabs: Tab[] = tabset.tabs

  // Tabs with placeholder
  let placeholderTabs: Tab[] = []
  let removeTabIds: string[] = []
  tabs.forEach((t: Tab) => {
    if (t.placeholders && t.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) {
      const subs = t.placeholders.config
      Object.entries(subs).forEach(e => {
        const name = e[0]
        const val = e[1]
        val.split(",").forEach((v: string) => {
          const substitution = v.trim()
          if (substitution.length > 0) {
            const clonedTab = JSON.parse(JSON.stringify(t));
            clonedTab.id = uid()
            clonedTab.description = undefined
            let useUrl = t.url || ''
            let useName = t.name || t.title || ''
            Object.entries(subs).forEach(e1 => {
              useUrl = useUrl.replaceAll("${" + e1[0] + "}", substitution)
              useName = useName.replaceAll("${" + e1[0] + "}", substitution)
            })
            clonedTab.url = useUrl
            clonedTab.name = useName
            placeholderTabs.push(clonedTab)
            removeTabIds.push(t.id)
          }
        })
      })
    }
  })
  tabs = _.filter(tabs, (t: Tab) => removeTabIds.indexOf(t.id) < 0)
  tabs = tabs.concat(placeholderTabs)


  // TODO order??
  const filter = useUiStore().tabsFilter
  if (!filter || filter.trim() === '') {
    return tabs
  }
  return _.filter(tabs, (t: Tab) => {
    return (t.url || '')?.indexOf(filter) >= 0 ||
        (t.title || '')?.indexOf(filter) >= 0 ||
        t.description?.indexOf(filter) >= 0
  })
}

if (inBexMode() && chrome) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

function getOrder() {
  if (tabsStore.getCurrentTabset) {
    switch (tabsStore.getCurrentTabset.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.url?.replace("https://", "").replace("http://", "").toUpperCase()
      case 'alphabeticalTitle':
        return (t: Tab) => t.title?.toUpperCase()
      default:
        return (t: Tab) => 1
    }
    return (t: Tab) => 1
  }
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

const hoveredOver = (tabsetId: string) => hoveredTabset.value === tabsetId

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
    (useUiStore().tabsFilter === '' || filteredTabs(tabset).length > 0)

const toolbarTitle = (tabsets: Tabset[]) => {
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES)) {
    const spaceName = useSpacesStore().space ? useSpacesStore().space.label : 'no space selected'
    return tabsets.length > 6 ?
        spaceName + ' (' + tabsets.length.toString() + ')' :
        spaceName
  }
  return tabsets.length > 6 ? 'My Tabsets (' + tabsets.length.toString() + ')' : 'My Tabsets'
}
const tabsetIcon = (tabset: Tabset) => {
  let icon = 'perm_identity'
  if (tabset.status === TabsetStatus.FAVORITE) {
    icon = 'push_pin'
  }
  if (tabset.type === TabsetType.DYNAMIC) {
    icon = 'o_label'
  }
  return icon
}

const focusOnTabset = (tabset: Tabset) => router.push("/sidepanel/tabsets/" + tabset.id)


</script>

<style scoped>

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
