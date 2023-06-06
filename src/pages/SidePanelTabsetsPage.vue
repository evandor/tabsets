<template>

  <div class="q-ma-none">

    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-2">
              <q-icon name="chevron_left" class="cursor-pointer" @click="router.push('/sidepanel')">
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col-9">
              <!--<SidePanelSpacesSelectorWidget/>-->
              Spaces
            </div>
            <div class="col-1 text-right">
              <q-icon
                class="q-ma-xs cursor-pointer" name="o_add" size="16px"
                @click="addSpace">
                <q-tooltip class="tooltip">Add Space</q-tooltip>
              </q-icon>
            </div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="q-pa-none">
      <q-list>
        <q-expansion-item
          v-for="space in spacesStore.spaces.values()"
          expand-separator
          :default-opened="spacesStore.space?.id === space.id"
          :label="space.label"
          :caption="tabsetsForSpace(space.id).length + ' tabsets'">
          <q-card>
            <q-card-section>
              <NavTabsetsListWidgetNonBex
                :tabsets="tabsetsForSpace(space.id)"
                :spaceId="space.id"
                :fromPanel="true"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item dense
                          expand-separator
                          label="Unassigned Tabsets"
                          :caption="tabsetsWithoutSpaces().length + ' tabsets'">
          <q-card>
            <q-card-section>
              <NavTabsetsListWidgetNonBex :tabsets="tabsetsWithoutSpaces()" :fromPanel="true"/>
            </q-card-section>
          </q-card>
        </q-expansion-item>


      </q-list>
    </div>


    <!-- <div class="row q-ma-sm">
       <div class="col-12">
         Tabsets associated with this space {{ useSpacesStore().space?.name }}:
       </div>
       <div class="col-12">
         <NavTabsetsListWidgetNonBex :tabsets="tabsets()" :fromPanel="true"/>
       </div>
     </div>

     <div class="row q-ma-sm">
       <div class="col-12">
         Tabsets without assigned spaces:
       </div>
       <div class="col-12">
         <NavTabsetsListWidgetNonBex :tabsets="tabsetsWithoutSpaces()" :fromPanel="true"/>
       </div>
     </div>-->

  </div>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import ChromeApi from "src/services/ChromeApi";
import {useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {uid, useQuasar} from "quasar";
import NavTabsetsListWidgetNonBex from "components/widgets/NavTabsetsListWidgetNonBex.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSpacesStore} from "src/stores/spacesStore";
import NewSpaceDialog from "components/dialogues/NewSpaceDialog.vue";

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

console.log("adding listener")

// if (inBexMode()) {
//   chrome.runtime.onMessage.addListener(({name, data}) => {
//     console.log("got message", name)
//     if (name === 'current-tabset-id-change') {
//       const tsId = data.tabsetId
//       console.log("hier", useTabsStore().getCurrentTabset, tsId)
//       useTabsStore().selectCurrentTabset(tsId)
//     }
//     return true
//   })
// } else {
//   useRouter().push("/start")
// }

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})
watchEffect(() => {
  console.log("tabset id", useTabsStore().currentTabsetId)
})
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

if (inBexMode()) {
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

// const createClip = () => {
//   if (currentChromeTabs.value[0]?.id) {
//     ChromeApi.executeClippingJS(currentChromeTabs.value[0]?.id)
//   }
// }

const navigate = (target: string) => router.push(target)

const tabsets = (): Tabset[] => {
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

const tabsetsForSpace = (tsId: string): Tabset[] => {
  return _.filter([...useTabsStore().tabsets.values()], (ts: Tabset) =>
    ts.spaces.indexOf(tsId) >= 0)
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

</script>
