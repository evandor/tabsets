<template>

  <q-page style="padding-top: 50px">
    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none q-pa-none">
      <q-list dense
              class="rounded-borders q-ma-none q-pa-none" :key="tabset.id"
              v-for="(tabset,index) in tabsets">
        <!-- :model-value="isExpanded(tabset.id)" -->
        <q-expansion-item v-if="showTabset(tabset as Tabset)"
                          :header-class="tabsStore.currentTabsetId === tabset.id ? 'bg-grey-4':''"
                          header-class="q-ma-none q-px-sm"
                          :header-style="tabsetExpanded.get(tabset.id) ?
              'border:0 solid grey;border-top-left-radius:4px;border-top-right-radius:4px' :
              'border:0 solid grey;border-radius:4px'"
                          group="tabsets"
                          :default-opened="false"
                          v-model="selected_model[tabset.id]"
                          @update:model-value="val => updateSelectedTabset(tabset.id, val, index)"
                          expand-separator>

          <template v-slot:header>
            <q-item-section
              @mouseover="hoveredTabset = tabset.id"
              @mouseleave="hoveredTabset = undefined">
              <q-item-label :class="tabsStore.currentTabsetId === tabset.id ? 'text-bold text-primary' : ''">
                <q-icon
                  :color="tabset.status === TabsetStatus.DEFAULT ? 'primary':'warning'"
                  :name="tabsetIcon(tabset as Tabset)"
                  style="position: relative;top:-2px"/>
                {{ tabset.name }}
              </q-item-label>
              <q-item-label class="text-caption text-grey-5">
                {{ tabsetCaption(filteredTabs(tabset as Tabset)) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side
                            @mouseover="hoveredTabset = tabset.id"
                            @mouseleave="hoveredTabset = undefined">
              <Transition appear>
                <div class="row items-center">
                    <span v-if="hoveredOver(tabset.id)">
                      <q-icon name="more_horiz" color="primary" size="16px"/>
                    </span>
                  <span v-else>
                      <q-icon color="primary" size="16px"/>
                    </span>

                  <SidePanelPageContextMenu :tabset="tabset as Tabset"/>

                </div>
              </Transition>
            </q-item-section>
          </template>


          <div class="q-ma-none q-pa-none" style="border:1px solid lightgrey">
            <!--             <div class="q-ma-xs shrink" :class="showTabInfo(tabset.id) ? '':'collapsed'">-->
            <div class="q-ma-xs">
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

        <template v-slot:title v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)">
          <q-icon name="o_space_dashboard" color="positive"/>
          {{ toolbarTitle(tabsets as Tabset[]) }}
          <q-btn
            icon="o_add"
            color="primary"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="10px"
            @click.stop="openNewTabsetDialog()">
            <q-tooltip class="tooltip">
              {{ useSpacesStore().space ? 'Add new Tabset in this space' : 'Add new unassigned Tabset' }}
            </q-tooltip>
          </q-btn>
        </template>
        <template v-slot:title v-else>
          {{ toolbarTitle(tabsets as Tabset[]) }}
          <q-btn
            icon="o_add"
            color="primary"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="10px"
            @click="openNewTabsetDialog()">
            <q-tooltip class="tooltip">Add new Tabset</q-tooltip>
          </q-btn>


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
import {useRoute, useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {scroll, useQuasar} from "quasar";
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
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import getScrollTarget = scroll.getScrollTarget;
import {DynamicTabSourceType} from "src/models/DynamicTabSource";


const {setVerticalScrollPosition} = scroll

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const uiStore = useUiStore()
const show = ref(false)
const showSearchBox = ref(false)

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const tabsetExpanded = ref<Map<string, boolean>>(new Map())
const tabs = ref<Map<string, Tab[]>>(new Map())

// https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript
interface SelectionObject {
  [key: string]: boolean
}

const selected_model = ref<SelectionObject>({})

const hoveredTabset = ref<string | undefined>(undefined)
const tabsets = ref<Tabset[]>([])

//const logs = ref<object[]>([])
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)

const selectedTab = ref<Tab | undefined>(undefined)


onMounted(() => {
  window.addEventListener('keypress', checkKeystroke);
})

onUnmounted(() => {
  window.removeEventListener('keypress', checkKeystroke);
})

watchEffect(() => {
  console.log(" >>> change in getSelectedTab", useUiStore().getSelectedTab)
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

const updateSelectedTabset = (tabsetId: string, open: boolean, index: number) => {
  //console.log("updated...", tabsetId, open, Object.keys(tabsetExpanded.value))
  tabsetExpanded.value.set(tabsetId, open)
  if (open) {
    scrollToElement(document.getElementsByClassName("q-expansion-item")[index], 300)

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
  //updateSelectedTabset(useTabsStore().currentTabsetId,true, 0)
  tabsetExpanded.value.set(currentTabsetId, true)
  const index = _.findIndex(tabsets.value as Tabset[], (ts: Tabset) => ts.id === currentTabsetId)
  scrollToElement(document.getElementsByClassName("q-expansion-item")[index], 300)
  useUiStore().tabsetsExpanded = true
  useCommandExecutor()
    .execute(new SelectTabsetCommand(currentTabsetId, useSpacesStore().space?.id))
})

watchEffect(() => {
  //console.log(" >>> change in opentabs or currenttabset", useTabsStore().tabs, useTabsStore().getCurrentTabset)
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
  //console.log(" >>> change in currentChromeTab", useTabsStore().currentChromeTab)
  currentChromeTab.value = useTabsStore().currentChromeTab
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
  //console.log(" >>> change in xxx")
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = _.sortBy(
      _.filter([...tabsStore.tabsets.values()], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return ts.status !== TabsetStatus.DELETED
      }),
      getTabsetOrder, ["asc"])
  } else {
    tabsets.value = _.sortBy(
      _.filter([...tabsStore.tabsets.values()],
        (ts: Tabset) => ts.status !== TabsetStatus.DELETED),
      getTabsetOrder, ["asc"])
  }
})


function inIgnoredMessages(message: any) {
  return message.msg === "html2text" ||
    message.msg === "html2links" ||
    message.name === "zero-shot-classification" ||
    message.msg === "websiteQuote" ||
    message.msg === "init-ai-module";
}

if (inBexMode()) {
  // seems we need to define these listeners here to get the matching messages reliably
  // these messages are created by triggering events in the mainpanel
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (inIgnoredMessages(message)) {
      return true
    }
    if (message.name === 'current-tabset-id-change') {
      console.log(" >>> got message", message)
      const tsId = message.data.tabsetId
      useTabsStore().selectCurrentTabset(tsId)
      //tabsetExpanded.value.set(tsId, true)
      console.log("xxx", selected_model.value)
      //selected_model.value[tsId as keyof object] = true
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

const filteredTabs = (tabset: Tabset): Tab[] => {
  if (tabset.type === TabsetType.DYNAMIC &&
    tabset.dynamicTabs && tabset.dynamicTabs.type === DynamicTabSourceType.TAG) {
    const results: Tab[] = []
    console.log("checking", tabset.dynamicTabs)
    const tag = tabset.dynamicTabs?.config['tags' as keyof object][0]
    console.log("using tag", tag)
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
  const tabs: Tab[] = tabset.tabs
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

if (inBexMode()) {
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
  for (const t: Tab of selectedTabset.tabs) {
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

const tabsetCaption = (tabs: Tab[]) => {
  const filter = useUiStore().tabsFilter
  if (!tabs) {
    return '-'
  }
  if (!filter || filter.trim() === '') {
    return tabs.length + ' tab' + (tabs.length === 1 ? '' : 's')
  } else {
    return tabs.length + ' tab' + (tabs.length === 1 ? '' : 's') + ' (filtered)'
  }
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
  (useUiStore().tabsFilter === '' || filteredTabs(tabset.tabs).length > 0)

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
  let icon = 'tab'
  if (tabset.status === TabsetStatus.FAVORITE) {
    icon = 'push_pin'
  }
  if (tabset.type === TabsetType.DYNAMIC) {
    icon = 'o_label'
  }
  return icon
}

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true
    }
  })
}

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
