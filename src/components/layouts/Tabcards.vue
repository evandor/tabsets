<template>
  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in props.tabs">
      <q-card class="my-card bg-amber-1" flat bordered style="height: 150px;max-height:150px; min-height: 150px;">
        <q-card-section horizontal>
          <q-card-section class="q-pt-xs" style="width:100%">
            <div class="row">
              <div class="col-11">
                <q-img
                  class="rounded-borders"
                  width="20px"
                  height="20px"
                  :src="tab.chromeTab.favIconUrl"
                />
              </div>
              <div class="col-1">
                <q-icon name="close" class="cursor-pointer" @click="closeTab(tab.chromeTab.id)"/>
              </div>
            </div>

            <div class="text-overline">
              {{ getHost(tab.chromeTab.url, true) }}
              <q-tooltip>
                {{ getHost(tab.chromeTab.url, false) }}
              </q-tooltip>
            </div>
            <div class="text-body1 q-mt-sm q-mb-xs">{{ maxChar(20, tab.chromeTab.title) }}</div>
            <div class="text-caption text-grey wrap" style="overflow:hidden;">
              <q-item-label lines="1" class="q-mt-xs text-body2 text-primary" @click="openOrCreateTab(tab.url)">
                <span class="cursor-pointer">{{ maxChar(30, withoutHostname(tab.chromeTab.url)) }}</span>
                <q-tooltip>
                  {{ tab.chromeTab.url }}
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
  const splits = url.split(getHost(url))
  if (splits.length > 1) {
    return "..." + splits[1]
  }
  return "---"
}

function maxChar(max: number, t: string): string {
  if (t.length > max - 3) {
    return t.substring(0, max - 3) + "..."
  }
  return t;
}



function closeTab(id: number) {
  chrome.tabs.remove(id)
}
</script>
