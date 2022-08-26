<template>
  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in props.tabs">
      <q-card class="my-card" flat bordered
              :style="cardStyle(tab)">
        <q-card-section horizontal>
          <q-card-section class="q-pt-xs" style="width:100%;">
            <div class="row">
              <div class="col-9">
                <q-img
                  class="rounded-borders"
                  width="20px"
                  height="20px"
                  :src="tab.chromeTab.favIconUrl">
                  <q-tooltip>{{ tab.chromeTab.id }}</q-tooltip>
                </q-img>
              </div>
              <div class="col-1">
                <div class="row">
                  <div class="col">
                    <q-icon name="save" class="cursor-pointer"
                            v-if="tab.status !== TabStatus.DEFAULT"
                            @click="saveTab(tab.chromeTab.id)"/>
                  </div>
                  <div class="col">
                    <q-icon :name="tab.chromeTab.pinned ? 'o_push_pin' : 'push_pin'" class="cursor-pointer"
                            @click="togglePin(tab.chromeTab.id)">
                      <q-tooltip v-text="tab.chromeTab.pinned ? 'Unpin this tab' : 'Pin this tab'" />
                    </q-icon>
                  </div>
                </div>
              </div>
              <div class="col-1">
              </div>
              <div class="col-1">
                <q-icon name="close" class="cursor-pointer"
                        @click="closeTab(tab.chromeTab.id)"/>
              </div>
            </div>

            <div class="text-overline">
              {{ getHost(tab.chromeTab?.url || tab.url, true) }} {{ tab.activatedCount }}/{{ tab.lastActive }}
              <q-tooltip>
                {{ getHost(tab.chromeTab?.url || tab.url, false) }}
              </q-tooltip>
            </div>
            <div class="text-body1 q-mt-sm q-mb-xs">{{ maxChar(20, tab.chromeTab?.title || tab.title) }}</div>
            <div class="text-caption text-grey wrap" style="overflow:hidden;">
              <q-item-label lines="1" class="q-mt-xs text-body2 text-primary"
                            @click="Navigation.openOrCreateTab(tab.chromeTab?.url || tab.url)">
                <span class="cursor-pointer">{{ maxChar(30, withoutHostname(tab.chromeTab?.url || tab.url)) }}</span>
                <q-tooltip>
                  {{ tab.chromeTab?.url || tab.url }}
                </q-tooltip>
              </q-item-label>
            </div>
          </q-card-section>

        </q-card-section>


      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {TabsetApi} from "src/services/TabsetApi";
import {LocalStorage} from "quasar";
import Navigation from "src/services/Navigation";
import {Tab, TabStatus} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  }
})

const tabsetApi = new TabsetApi(null as unknown as LocalStorage)

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


function closeTab(id: number) {
  Navigation.closeTab(id)
  //chrome.tabs.remove(id)
}

function saveTab(id: number) {
  console.log("saving tab", id)
  TabsetService.setStatus(id, TabStatus.DEFAULT)
}

function togglePin(tabId: number) {
  console.log("toggling pin", tabId)
  TabsetService.togglePin(tabId)
}


function cardStyle(tab: Tab) {
  const height = "150px";
  let borderColor = ""
  if (TabStatus.CREATED === tab.status) {
    borderColor = "border-color:green";
  } else if (TabStatus.DELETED === tab.status) {
    borderColor = "border-color:#EF9A9A"
  }
  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  // style=""
  return `height: ${height};max-height:${height}; min-height: ${height};${borderColor};${background}`
}
</script>
