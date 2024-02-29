<template>

  <q-page style="padding-top: 50px">

    <div class="q-ma-none q-pa-none">

      <InfoMessageWidget
        :probability="1"
        ident="sidePanelSpacesPage_overview">
        <b>Spaces</b> are a way to <b>organize your tabsets</b> if you have many. A Space is a
        collection of tabsets, and <b>each tabset can be assigned to multiple Spaces</b>.
        Deleting a Space does not delete any associated tabsets.
      </InfoMessageWidget>

      <q-list dense
              class="rounded-borders q-ma-none q-pa-none" :key="space.id"
              v-for="(space,index) in sortedSpaces">

        <q-expansion-item
          header-class="q-ma-none q-pa-none q-pr-md bg-grey-2"
          :header-style="headerStyle(space)"
          dense-toggle
          switch-toggle-side>

          <template v-slot:header>

            <SpaceHeader
              :key="randomKey"
              :caption="headerCaption(space.id)"
              :spaceLabel="space.label"
              :spaceId="space.id"/>

          </template>


          <div class="row">
            <div class="col text-right" style="border-bottom:1px solid lightgray">
              <q-icon
                class="q-ma-xs cursor-pointer" name="o_add" size="16px"
                color="primary"
                @click="openNewTabsetDialog(space.id)">
                <q-tooltip class="tooltip">Add Tabset</q-tooltip>
              </q-icon>
            </div>
          </div>
          <q-card>
            <q-card-section>
              ***
              <NavTabsetsListWidgetNonBex
                :tabsets="tabsetsForSpaces.get(space.id) || []"
                :spaceId="space.id"
                :fromPanel="true"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>


      </q-list>

      <q-list dense
              class="rounded-borders q-ma-none q-pa-none">

        <q-separator class="q-mb-md" v-if="sortedSpaces.length > 1 && tabsetsWithoutSpaces().length > 0"/>

        <q-expansion-item dense
                          v-if="tabsetsWithoutSpaces().length > 0"
                          expand-separator
                          label="Unassigned Tabsets"
                          :caption="tabsetsWithoutSpaces().length + ' tabset(s)'">

          <InfoMessageWidget v-if="useSpacesStore().spaces.size === 0"
                             :probability="1"
                             ident="sidePanelSpacesPage_unassignedTabsets">
            Start by creating a new Space by clicking on the plus sign and
            add tabsets to it.
          </InfoMessageWidget>

          <q-card>
            <q-card-section>
              <NavTabsetsListWidgetNonBex :tabsets="tabsetsWithoutSpaces()" :fromPanel="true"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>


      </q-list>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">

      <FirstToolbarHelper
        @was-clicked="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
        :show-back-button="true">
        <template v-slot:title>
          <!--          <q-icon name="o_space_dashboard" color="primary" size="18px"/>-->

          <q-btn flat color="black" @click="router.push('/sidepanel')"
                 no-caps
                 :label="usePermissionsStore().hasFeature(FeatureIdent.SPACES) ? 'Spaces' : 'Tabset List'"/>
          <q-tooltip :delay="1000" class="tooltip">Click to return to Tabsets View</q-tooltip>

        </template>
        <template v-slot:iconsRight>
          <q-btn
            icon="more_horiz"
            color="primary"
            flat
            class="q-ma-none q-pa-xs q-mr-sm cursor-pointer"
            style="max-width:20px"
            size="10px"
            @click="manageSpaces()">
            <q-tooltip class="tooltip">Manage Spaces</q-tooltip>
          </q-btn>
          <q-btn
            icon="o_add_circle"
            color="positive"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="12px"
            data-testid="addTabsetBtn"
            @click="addSpace()">
          </q-btn>
        </template>
      </FirstToolbarHelper>

    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, onUnmounted, ref, watch, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {uid, useQuasar} from "quasar";
import NavTabsetsListWidgetNonBex from "components/widgets/NavTabsetsListWidgetNonBex.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSpacesStore} from "src/stores/spacesStore";
import NewSpaceDialog from "components/dialogues/NewSpaceDialog.vue";
import NavigationService from "src/services/NavigationService";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {SidePanelView, useUiStore} from "stores/uiStore";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {useWindowsStore} from "src/stores/windowsStore";
import Analytics from "src/utils/google-analytics";
import {Space} from "src/models/Space";
import SpaceHeader from "pages/sidepanel/helper/SpaceHeader.vue";
import FirestorePersistenceService from "src/services/persistence/FirestorePersistenceService";
import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import {useTabsetService} from "src/services/TabsetService2";

const {inBexMode} = useUtils()

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const tabsetsForSpaces = ref<Map<string, Tabset[]>>(new Map())
const hoveredSpace = ref<string | undefined>(undefined)
const sortedSpaces = ref<Space[]>([])
const randomKey = ref<string>(uid())

function getSortedSpaces() {
  return _.sortBy([...spacesStore.spaces.values()],
    [function (o) {
      return o.label?.toLowerCase()
    }]);
}

const onMessageListener = async (message: any, sender: any, sendResponse: any) => {
  console.log(" <<< received message", message)
  if (message.name === "reload-spaces") {
    const tsId = message.data.changedTabsetId
    console.log("tsId", tsId)
    await useTabsetService().reloadTabset(tsId)
    sortedSpaces.value = getSortedSpaces()
    tabsetsForSpaces.value = await getTabsetsForSpaces()
    randomKey.value = uid()
    //console.log("tabsetsForSpace", tabsetsForSpaces.value)
  }
}

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSpacesPage', document.location.href);
  if (!usePermissionsStore().hasFeature(FeatureIdent.SPACES)) {
    router.push("/sidepanel")
    return
  }

  if (inBexMode()) {
    //console.log("====> adding listener <====", chrome.runtime.onMessage.hasListeners())
    chrome.runtime.onMessage.addListener(onMessageListener)
  }
})

onUnmounted(() => {
  // TODO unmount other listeners as well!
  //console.log("====> removing listener <====", chrome.runtime.onMessage.hasListener(onMessageListener))
  chrome.runtime.onMessage.removeListener(onMessageListener)
  //console.log("====> removing listener <====", chrome.runtime.onMessage.hasListener(onMessageListener))
})


watchEffect(() => {
  sortedSpaces.value = getSortedSpaces()
})

async function getTabsetsForSpaces() {
  let res: Map<string, Tabset[]> = new Map()
  //console.log("===>", [...useTabsStore().tabsets.values()])
  //await IndexedDbPersistenceService.loadTabsets()
  console.log("===>", [...useTabsStore().tabsets.values()][0].spaces)
  _.forEach([...useTabsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
    if (ts.status !== TabsetStatus.DELETED) {
      console.log("checking tabset", ts.id)
      _.forEach(ts.spaces, (spaceId: string) => {
        console.log("  tabset has space", spaceId)
        if (res.has(spaceId)) {
          console.log("exists already", spaceId)
          const exisitingTabsets: Tabset[] = res.get(spaceId) || []
          console.log("existings tabsets", exisitingTabsets)
          if (exisitingTabsets.findIndex(t => t.id === ts.id) < 0) {
            res.set(spaceId, (res.get(spaceId) || []).concat([ts]))
          }
        } else {
          console.log("adding to spaceId", spaceId, ts.id)
          res.set(spaceId, [ts])
        }
      })
    }
  })
  res.forEach((value: Tabset[], key: string) => {
    res.set(key, _.sortBy(value, [
      function (o) {
        return o.name.toLowerCase()
      }
    ]))
  });
  return res;
}

watchEffect(async () => {
  let res = await getTabsetsForSpaces();
  console.log("tabsetsForSpace1", res)
  tabsetsForSpaces.value = res // useSpacesStore().tabsetsForSpaces()
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
  //currentChromeTab.value = useTabsStore().currentChromeTab
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
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

if (inBexMode()) {
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

const tabsetsWithoutSpaces = (): Tabset[] => {
  let tabsets = [...tabsStore.tabsets.values()]
  return _.sortBy(_.filter(tabsets, (ts: Tabset) =>
      ts.spaces.length === 0 &&
      ts.type !== TabsetType.SPECIAL &&
      ts.status !== TabsetStatus.ARCHIVED &&
      ts.status !== TabsetStatus.DELETED),
    [
      function (o) {
        return o.status === TabsetStatus.FAVORITE ? 0 : 1
      },
      function (o) {
        return o.name.toLowerCase()
      }
    ])
}

const addSpace = () => {
  $q.dialog({
    component: NewSpaceDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      fromPanel: true
    }
  })
}

const manageSpaces = () =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL('www/index.html#/mainpanel/spaces')])

const openNewTabsetDialog = (spaceId: string) => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: tabsStore.currentTabsetId,
      spaceId: spaceId,
      fromPanel: true
    }
  })
}

const headerStyle = (space: Space) => {
  let style = //tabsetExpanded.value.get(tabset.id) ?
    'border:0 solid grey;border-top-left-radius:4px;border-top-right-radius:4px;'
//:
  //    'border:0 solid grey;border-radius:4px;'
  style = style + 'border-left:4px solid #f5f5f5'

  return style
}

const headerCaption = (spaceId: string) => {
  console.log("headerCaption", spaceId, tabsetsForSpaces.value.get(spaceId)?.length)
  return (tabsetsForSpaces.value.get(spaceId) || []).length + ' tabset(s)'
}

</script>
