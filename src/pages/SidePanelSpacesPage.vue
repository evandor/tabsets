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

      <q-list dense v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)">
        <q-expansion-item
          v-for="space in spacesStore.spaces.values()"
          expand-separator>

          <template v-slot:header>
            <q-item-section
              @mouseover="hoveredSpace = space.id"
              @mouseleave="hoveredSpace = undefined">
              <q-item-label :class="spacesStore.space?.id === space.id ? 'text-bold text-primary' : ''">
                <q-icon
                  color="positive"
                  name="o_space_dashboard"
                  style="position: relative;top:-2px"/>
                {{ space.label }}
              </q-item-label>
              <q-item-label class="text-caption text-grey-5">
                {{ (tabsetsForSpace.get(space.id) || []).length + ' tabsets' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side
                            @mouseover="hoveredSpace = space.id"
                            @mouseleave="hoveredSpace = undefined">
              <Transition appear>
                <div class="row items-center">
                    <span v-if="hoveredOver(space.id)">
                      <q-icon name="more_horiz" color="primary" size="16px"/>
                    </span>
                  <span v-else>
                      <q-icon color="primary" size="16px"/>
                    </span>

                  <!--                    <SidePanelPageContextMenu :tabset="tabset as Tabset"/>-->

                </div>
              </Transition>
            </q-item-section>
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
              <NavTabsetsListWidgetNonBex
                :tabsets="tabsetsForSpace.get(space.id) || []"
                :spaceId="space.id"
                :fromPanel="true"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item dense
                          expand-separator
                          label="Unassigned Tabsets"
                          :caption="tabsetsWithoutSpaces().length + ' tabsets'">

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

      <q-list v-else>
        <q-card>
          <q-card-section>
            <NavTabsetsListWidgetNonBex
              :tabsets="[...tabsStore.tabsets.values()]"
              :fromPanel="true"/>
          </q-card-section>
        </q-card>
      </q-list>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper
        @was-clicked="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
        :show-back-button="true">
        <template v-slot:title>
          <!--          <q-icon name="o_space_dashboard" color="primary" size="18px"/>-->
          {{ usePermissionsStore().hasFeature(FeatureIdent.SPACES) ? 'Spaces' : 'Tabset List' }}
          <q-btn
            icon="o_add"
            color="primary"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="10px"
            @click="addSpace()">
            <q-tooltip class="tooltip">Create new Space</q-tooltip>
          </q-btn>
        </template>
        <template v-slot:iconsRight>
          <q-btn
            icon="more_horiz"
            color="primary"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="10px"
            @click="manageSpaces()">
            <q-tooltip class="tooltip">Manage Spaces</q-tooltip>
          </q-btn>
        </template>
      </FirstToolbarHelper>

    </q-page-sticky>

  </q-page>

  <!--  <div class="q-ma-none">-->

  <!--    <q-toolbar class="text-primary lightgrey">-->
  <!--      <div class="row fit">-->
  <!--        <q-toolbar-title>-->
  <!--          <div class="row">-->
  <!--            <div class="col-2 text-right">-->
  <!--              <q-icon-->
  <!--                class="q-ma-xs cursor-pointer" name="more_horiz" size="16px"-->
  <!--                @click="manageSpaces">-->
  <!--                <q-tooltip class="tooltip">Manage Spaces</q-tooltip>-->
  <!--              </q-icon>-->
  <!--            </div>-->
  <!--          </div>-->
  <!--        </q-toolbar-title>-->
  <!--      </div>-->
  <!--    </q-toolbar>-->


</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {useQuasar} from "quasar";
import NavTabsetsListWidgetNonBex from "components/widgets/NavTabsetsListWidgetNonBex.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSpacesStore} from "src/stores/spacesStore";
import NewSpaceDialog from "components/dialogues/NewSpaceDialog.vue";
import NavigationService from "src/services/NavigationService";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {SidePanelView, useUiStore} from "stores/uiStore";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SidePanelPageContextMenu from "pages/sidepanel/SidePanelPageContextMenu.vue";

const {inBexMode} = useUtils()

const $q = useQuasar()
const router = useRouter()
const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const tabsetsForSpace = ref<Map<string, Tabset[]>>(new Map())
const hoveredSpace = ref<string | undefined>(undefined)

watchEffect(() => {
  const start = new Date().getTime()
  let res: Map<string, Tabset[]> = new Map()
  _.forEach([...useTabsStore().tabsets.values()], (ts: Tabset) => {
    _.forEach(ts.spaces, (spaceId: string) => {
      if (res.has(spaceId)) {
        res.set(spaceId, (res.get(spaceId) || []).concat([ts]))
      } else {
        res.set(spaceId, [ts])
      }
    })
  })
  tabsetsForSpace.value = res // useSpacesStore().tabsetsForSpaces()
})

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    console.log("calling tabsFotUrl")
    //currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
  console.log("calling 1")
})

watchEffect(() => currentChromeTab.value = useTabsStore().currentChromeTab)

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
  console.log("calling tabsQuery")
  let queryOptions = {active: true, lastFocusedWindow: true};
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
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

const navigate = (target: string) => router.push(target)

const tabsets = (): Tabset[] => {
  console.log("calling tabsets")

  let tabsets = [...tabsStore.tabsets.values()]
  if (usePermissionsStore().hasFeature(FeatureIdent.SPACES) && spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0)
    } else {
      tabsets = _.filter(tabsets, ts => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.length === 0)
    }
  }
  return _.sortBy(_.filter(tabsets, (ts: Tabset) =>
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

const tabsetsWithoutSpaces = (): Tabset[] => {
  console.log("calling tabsetsWithoutSpaces")

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
  NavigationService.openOrCreateTab(chrome.runtime.getURL('www/index.html#/mainpanel/spaces'))

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

const hoveredOver = (spaceId: string) => hoveredSpace.value === spaceId


</script>
