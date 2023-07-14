<template>
  <q-card class="my-card" flat bordered :style="cardStyle(tab)">
    {{ loadThumbnail(tab) }}
    <q-card-section class="q-pt-xs cursor-pointer bg-primary text-white" style="width:100%;">
      <div class="row items-baseline">
        <div class="col-8">
          <TabFaviconWidget :tab="tab" width="22px" height="22px"/>

          <!-- title or name if given -->
          <div class="text-subtitle1 ellipsis">
            {{ nameOrTitle(tab) }}
            <q-tooltip>{{ tab.title }}</q-tooltip>
            <q-badge v-if="tab.bookmarkId"
                     color="info" floating>
              <q-icon name="o_bookmark" size="14px" color="white">
                <q-tooltip>You have a bookmark with this url</q-tooltip>
              </q-icon>
            </q-badge>
          </div>
        </div>

        <div class="col-4">
          <q-img :src="thumbnailFor(tab)" width="48px" height="32px" no-spinner
                 style="border:1px solid #efefef; border-right: 3px;">
          </q-img>
        </div>

        <div class="text-subtitle2 ellipsis text-secondary"
             @click.stop="goto(tab.url)">
          {{ tab.url.replace("https://www.", '').replace("https://", '') }}
          <q-icon name="launch" color="secondary"></q-icon>
          <q-tooltip>
            {{ tab.url }}
          </q-tooltip>
        </div>
      </div>

    </q-card-section>
    <!--    <q-card-section class="q-ma-none q-pa-xs">-->

    <!--      <div class="row fit">-->
    <!--        <div class="col-4 cursor-pointer">-->
    <!--          <q-img :src="thumbnailFor(tab)" width="48px" height="32px" no-spinner-->
    <!--                 style="border:1px solid #efefef; border-right: 3px;"></q-img>-->
    <!--        </div>-->
    <!--        <div class="col-8 text-right">-->

    <!--        </div>-->
    <!--      </div>-->

    <!--    </q-card-section>-->


  </q-card>
</template>

<script setup lang="ts">

import {Tab, UrlExtension} from "src/models/Tab"
import TabsetService from "src/services/TabsetService"
import {ref} from "vue"
import {useQuasar} from "quasar"
import TabFaviconWidget from "src/components/widgets/TabFaviconWidget.vue"

const props = defineProps({
  tab: {
    type: Object,
    required: true
  }
})
const $q = useQuasar()
const thumbnails = ref<Map<string, string>>(new Map())

const thumbnailFor = (tab: Tab): string => {
  if (tab.extension === UrlExtension.IMAGE) {
    return tab.url || 'favicon-unknown-32x32.png'
  }
  const key = btoa(tab.url || '')
  return thumbnails.value.get(key) || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
}

const loadThumbnail = (tab: Tab) => {
  TabsetService.getThumbnailFor(tab)
    .then(data => {
      const key = btoa(tab.url || '')
      if (data && data.thumbnail) {
        thumbnails.value.set(key, data.thumbnail)
      }
    })
    .catch(err => console.log("err", err))
}


function cardStyle(tab: Tab) {
  return ``
}

function isOpen(tab: Tab): boolean {
  return TabsetService.isOpen(tab?.url || '')
}


const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.title
const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.title

const goto = (url: string) => {
  chrome.tabs.update({url: url})
}

</script>
