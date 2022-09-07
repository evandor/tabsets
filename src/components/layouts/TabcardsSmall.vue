<template>
  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in props.tabs"
         style="border-bottom: 2px solid grey;">
      <q-card class="my-card" flat bordered square
              :style="cardStyle(tab)">
        <q-card-section class="q-pt-xs cursor-pointer" style="width:100%;" @click="hightlightTab(tab)">
          <div class="row items-baseline">
            <div class="col-2">
              <q-img
                class="rounded-borders"
                width="20px"
                height="20px"
                :src="tab.chromeTab?.favIconUrl">
              </q-img>
            </div>
            <div class="col-9 text-body2 ellipsis">
              {{ maxChar(20, tab.chromeTab?.title) }}
            </div>
            <div class="col-1">
              <q-icon name="close" @click="closeTab(tab)"/>
            </div>
            <q-tooltip>
              {{ getHost(tab.chromeTab.url, true) }}
            </q-tooltip>

          </div>


        </q-card-section>


      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navigation from "src/services/Navigation";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import ChromeApi from "src/services/ChromeApi";

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  }
})

function getShortHostname(host: string) {
  const nrOfDots = (host.match(/\./g) || []).length
  if (nrOfDots >= 2) {
    return host.substring(host.indexOf(".", nrOfDots - 2) + 1)
  }
  return host
}

function getHost(urlAsString: string, shorten: Boolean = true): string {
  try {
    const url = new URL(urlAsString)
    if (!shorten) {
      return url.protocol + "://" + url.host.toString()
    }
    return getShortHostname(url.host)
  } catch (e) {
    return "---";
  }
}

function withoutHostname(url: string) {
  const splits = url?.split(getHost(url))
  if (splits?.length > 1) {
    return "..." + splits[1]
  }
  return "---"
}

function maxChar(max: number, t: string): string {
  if (t?.length > max - 3) {
    return t.substring(0, max - 3) + "..."
  }
  return t;
}


function closeTab(tab: Tab) {
  Navigation.closeTab(tab)
}

function cardStyle(tab: Tab) {
  const height = "40px";
  let borderColor = ""
  if (TabStatus.CREATED === tab.status) {
    borderColor = "";
  } else if (TabStatus.DELETED === tab.status) {
    borderColor = "border-color:#EF9A9A"
  }
  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  // style=""
  return `height: ${height};max-height:${height}; min-height: ${height};border:1px solid grey;border-bottom: 0px;position:relative; top:5px;${background}`
}

function isOpen(tab: Tab): boolean {
  //console.log("tabUrl", tab.chromeTab?.url);
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

const hightlightTab = (tab: Tab) => {
  ChromeApi.highlight(tab.chromeTab.index)
}

</script>
