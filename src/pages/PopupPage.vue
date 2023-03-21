<template>
  <div class="row q-ma-sm" style="max-width:390px; max-height:300px; border:1px solid red">
    <div class="col-12">
      <q-btn label="Open Tabsets" @click="openExtensionTab"/>
    </div>
    <div class="col-3">
      x
    </div>
    <div class="col-9">
      <div class="row">
        <div class="col-3">
          Tab
        </div>
        <div class="col-9 ellipsis">
          {{ currentChromeTabs[0]?.url }}
        </div>
        <div class="col-3">
          Title
        </div>
        <div class="col-9 ellipsis">
          {{ currentChromeTabs[0]?.title }}
        </div>
      </div>
    </div>
  </div>

  <div class="row q-ma-sm" style="max-width:390px; max-height:300px; border:1px solid red">
    <div class="col-3">
      Tabset
    </div>
    <div class="col-9">
      <q-select v-model="tabsetName" :options="tabsetNameOptions" label="Standard"/>
    </div>
  </div>

  <div class="row q-ma-sm" style="max-width:390px; max-height:300px; border:1px solid red">
    <div class="col-3">

    </div>
    <div class="col-9">
      <q-btn label="Save" @click="save()"></q-btn>
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
import {useTabsetService} from "src/services/TabsetService2";
import {uid} from "quasar";

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const tabsetName = ref(null)
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
  console.log("saving...", tabsetName.value)
  if (tabsetName.value && tabsetName.value['value' as keyof object]) {
    // @ts-ignore
    chrome.scripting.executeScript({
      target: {tabId: currentChromeTabs.value[0]?.id, allFrames: true},
      args: [currentChromeTabs.value[0], tabsetName.value['value' as keyof object]],
      func: (tabId: number, tabsetId: string) => {

        if (window.getSelection()?.anchorNode && window.getSelection()?.anchorNode !== null) {
          const msg = {
            msg: "addTabToTabset",
            tabId: tabId,
            tabsetId: tabsetId
          }
          console.log("sending message", msg)
          chrome.runtime.sendMessage(msg, function (response) {
            console.log("created new tab in current tabset:", response)
          });
        }
      }
    }, (result:any) => {
      console.log("result", result)
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
