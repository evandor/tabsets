<template>
  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in props.tabs">
      <q-card class="my-card" flat bordered style="height: 200px;max-height:200px; min-height: 200px;">
        <q-card-section horizontal class="bg-amber-1">
          <q-card-section class="q-pt-xs"  style="width:100%">
            <div class="row">
              <div class="col-11">
                <q-img
                  class="rounded-borders"
                  width="20px"
                  height="20px"
                  :src="tab.favIconUrl"
                />
              </div>
              <div class="col-1">
                <q-icon name="close" class="cursor-pointer" @click="closeTab(tab.id)" />
              </div>
            </div>

            <div class="text-overline">{{ getHost(tab.url) }}</div>
            <div class="text-h6 q-mt-sm q-mb-xs">{{ maxChar(20, tab.title) }}</div>
            <div class="text-caption text-grey wrap" style="overflow:hidden;">
              <q-item-label lines="1" class="q-mt-xs text-body2 text-primary" @click="openOrCreateTab(tab.url)">
                <span class="cursor-pointer">{{ maxChar(30, tab.url) }}</span>
              </q-item-label>
            </div>
          </q-card-section>

        </q-card-section>

        <q-separator/>

        <q-card-actions class="bg-amber-2" style="min-height:50px;max-height:50px">
          <q-btn flat round icon="event"/>
          <!--<q-btn flat>
            7:30PM
          </q-btn>
          <q-btn flat color="primary">
            Reserve
          </q-btn>-->
        </q-card-actions>
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

function getHost(urlAsString: string): string {
  try {
    const url = new URL(urlAsString)
    return url.host
  } catch (e) {
    return "---";
  }
}

function maxChar(max: number, t: string): string {
  if (t.length > max - 3) {
    return t.substring(0, max-3) + "..."
  }
  return t;
}

function openOrCreateTab(withUrl: string) {
  //console.log("hier", withUrl)
  let found = false;
  chrome.tabs.query({currentWindow: true}, (t: chrome.tabs.Tab[]) => {
    t.filter(r => !r.url.startsWith("chrome"))
      .map(r => {
        if (withUrl === r.url) {
          found = true
          chrome.tabs.highlight({tabs: r.index});
        }
      });
  });
  console.log("found", found)
  if (!found) {
    chrome.tabs.create({
      active: false,
      pinned: false,
      url: withUrl
    })
      .catch(e => {
        console.log("got error", e)
      })
  }
}

function closeTab(id: number) {
  chrome.tabs.remove(id)
}
</script>
