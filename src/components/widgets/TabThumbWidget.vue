<template>

  <q-card class="my-card" flat bordered :style="cardStyle(tab)" @mouseover="setInfo(tab)" @click="selectTab(tab)">
    {{ loadThumbnail(tab) }}
    <q-card-section class="q-pt-xs cursor-pointer bg-primary text-white" style="width:100%;">
      <div class="row items-baseline">

        <div class="col-12">
          <q-img
            class="rounded-borders"
            style="cursor: move; max-height:75px"
            width="100%"

            :src="thumbnailFor(tab)">
            <q-tooltip>{{ tab.chromeTab?.id }} / {{ tab.id }}</q-tooltip>
          </q-img>
        </div>

      </div>


      <div class="text-subtitle2 ellipsis text-secondary"
           @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )">
        {{ tab.chromeTab?.url.replace("https://www.", '').replace("https://", '') }}
        <q-icon name="launch" color="secondary"></q-icon>
        <q-tooltip>
          {{ tab.chromeTab?.url }}
        </q-tooltip>

      </div>
      <div class="text-subtitle2 ellipsis text-white">
        {{ nameOrTitle(tab) }}
      </div>

    </q-card-section>

  </q-card>
</template>

<script setup lang="ts">

import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {useNotificationsStore} from "stores/notificationsStore";
import {ref} from "vue";
import Navigation from "src/services/Navigation";
import MHtmlService from "src/services/MHtmlService";

const props = defineProps({
  tab: {
    type: Object,
    required: true
  },
  highlightUrl: {
    type: String,
    required: false
  }
})

const emits = defineEmits(['sendCaption'])
const thumbnails = ref<Map<string, string>>(new Map())

const thumbnailFor = (tab: Tab): string => {
  const key = btoa(tab.chromeTab.url || '')
  return thumbnails.value.get(key) || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
}

const loadThumbnail = (tab: Tab) => {
  TabsetService.getThumbnailFor(tab)
    .then(data => {
      //console.log("loading tn for ", tab.chromeTab.url)
      const key = btoa(tab.chromeTab.url || '')
      if (data && data.thumbnail) {
        //console.log("found key", key, data)
        thumbnails.value.set(key, data.thumbnail)
      }
    })
    .catch(err => console.log("err", err))
}


function cardStyle(tab: Tab) {
  let borderColor = ""
  if (isOpen(tab)) {
    borderColor = "border-color:#8f8f8f"
  }
  if (tab?.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  if (tab?.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  } else if (tab?.chromeTab.url === props.highlightUrl) {
    background = "background: radial-gradient(circle, #FFBF46 0%, #FFBF46 100%)"
  }
  return `${borderColor};${background}`
}

function isOpen(tab: Tab): boolean {
  //console.log("tabUrl", tab.chromeTab?.url);
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

const setInfo = (tab: Tab) => {
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}

const setCustomTitle = (tab: Tab, newValue: string) => {
  console.log(" -> ", newValue)
  TabsetService.setCustomTitle(tab, newValue)
}


const selectTab = (tab: Tab) => {
  //console.log("tab selected", tab)
  TabsetService.setOnlySelectedTab(tab)
  const notificationStore = useNotificationsStore()
  notificationStore.setSelectedTab(tab)
}

const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    //console.log("chromeTab.favIconUrl", chromeTab.favIconUrl)
    return chromeTab.favIconUrl
  }
  return ''
}

const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title
const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

function closeTab(tab: Tab) {
  Navigation.closeTab(tab)
}

const saveTab = (tab: Tab) => {
  if (tab.chromeTab.id) {
    console.log("capturing", tab.chromeTab)
    chrome.pageCapture.saveAsMHTML(
      {tabId: tab.chromeTab.id},
      (html: any) => {
        MHtmlService.saveMHtml(tab, html)
      }
    )
  }
}

</script>
