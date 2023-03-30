<template>
  <div class="row q-ma-sm" style="max-width:390px;">
    <div class="col-12 text-right">
      <q-btn label="Open Tabsets" size="12px" @click="openExtensionTab"/>
    </div>
    <div class="col-12">
      <hr>
    </div>
    <div class="col-12">
      <div class="row">
        <div class="col-3 text-bold">
          Tab
        </div>
        <div class="col-9 ellipsis-2-lines">
          {{ currentChromeTabs[0]?.url }}
        </div>
        <div class="col-3 text-bold">
          Title
        </div>
        <div class="col-9 ellipsis-3-lines">
          {{ currentChromeTabs[0]?.title }}
        </div>
      </div>
    </div>
  </div>

  <div class="row q-ma-sm q-mt-xl" style="max-width:390px">
    <div class="col-3 text-bold">

    </div>
    <div class="col-9">
      Select the tabset you want to save this tab to:
    </div>
  </div>

  <div class="row q-ma-sm" style="max-width:390px">
    <div class="col-3 text-bold">

    </div>
    <div class="col-9">
      <q-select dense options-dense v-model="tabsetName" :options="tabsetNameOptions" label="Choose"/>
    </div>
  </div>

  <div class="row q-ma-sm" style="max-width:390px;">
    <div class="col-3">

    </div>
    <div class="col-9 text-right">
      <q-btn label="Save" size="12px" @click="save()" style="width:120px"></q-btn>
    </div>
  </div>

</template>

<script lang="ts" setup>

import NavigationService from "src/services/NavigationService";
import {ref, watchEffect} from "vue";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset} from "src/models/Tabset";

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    console.log("checking", currentChromeTabs.value[0].url)
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
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

const openExtensionTab = () => {
  const extensionUrl = chrome.runtime.getURL('www/index.html')
  NavigationService.openOrCreateTab(extensionUrl)
}

let queryOptions = {active: true, lastFocusedWindow: true};
chrome.tabs.query(queryOptions, (tab) => {
  currentChromeTabs.value = tab
})

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
    }, (result:any) => {
      console.log("result", result)
      //window.close()
    });

  }

  // if (currentChromeTabs.value[0] && tabsetName.value) {
  //   useTabsetService().saveToTabsetId(tabsetName.value['value' as keyof object], new Tab(uid(), currentChromeTabs.value[0]))
  //     .then(() => {
  //       console.log("chrome.notification")
  //       chrome.notifications.create(
  //         {
  //           title: "Tabset Extension Message",
  //           type: "basic",
  //           //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
  //           iconUrl: chrome.runtime.getURL("www/favicon.ico"),
  //           message: "the tab has been created successfully"
  //         }, (nid:any) => {
  //           console.log("nid", nid)
  //         }
  //       )
  //     })
  //     .catch((err: any) => {
  //       console.log("catching rejection", err)
  //       chrome.notifications.create(
  //         {
  //           title: "Tabset Extension Message",
  //           type: "basic",
  //           //iconUrl: "chrome-extension://" + selfId + "/www/favicon.ico",
  //           iconUrl: chrome.runtime.getURL("www/favicon.ico"),
  //           message: "tab could not be added: " + err
  //         }, (nid:any) => {
  //           console.log("nid", nid)
  //         }
  //       )
  //
  //     })
  // }
}

</script>
