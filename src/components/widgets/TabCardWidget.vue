<template>
  <q-card class="my-card" flat bordered :style="cardStyle(tab)"
          @mouseover="setInfo(tab)"
          @click="selectTab(tab)">
    {{ loadThumbnail(tab) }}
    <q-card-section class="q-pt-xs cursor-pointer bg-primary text-white" style="width:100%;">
      <div class="row items-baseline">

        <!-- favicon -->
        <TabFaviconWidget :tab="tab" width="22px" height="22px" />

        <!-- title or name if given -->
        <div class="col-10 text-subtitle1 ellipsis">
          !!!{{ nameOrTitle(tab) }}
          <q-popup-edit :model-value="dynamicNameOrTitleModel(tab)" v-slot="scope"
                        @update:model-value="val => setCustomTitle( tab, val)">
            <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>
          </q-popup-edit>
          <q-tooltip>{{ tab.chromeTab.title }}</q-tooltip>


          <q-badge v-if="tab.bookmarkId"
                   color="info" floating>
            <q-icon name="o_bookmark" size="14px" color="white">
              <q-tooltip>You have a bookmark with this url</q-tooltip>
            </q-icon>
          </q-badge>
          <!--        <q-badge v-if="tab.note?.length > 0"-->
          <!--                 color="warning" floating>-->
          <!--          <q-icon name="o_note" size="14px" color="white">-->
          <!--            <q-tooltip>You have a note attached to this tab</q-tooltip>-->
          <!--          </q-icon>-->
          <!--        </q-badge>-->
        </div>
      </div>


      <div class="text-subtitle2 ellipsis text-secondary"
           @click.stop="NavigationService.openOrCreateTab(tab.chromeTab?.url )">
        {{ tab.chromeTab?.url.replace("https://www.", '').replace("https://", '') }}
        <q-icon name="launch" color="secondary"></q-icon>
        <q-tooltip>
          {{ tab.chromeTab?.url }}
        </q-tooltip>
      </div>

    </q-card-section>
    <q-card-section class="q-ma-none q-pa-xs">

      <div class="row fit">
        <div class="col-4 cursor-pointer">
          <q-img :src="thumbnailFor(tab)" width="48px" height="32px" no-spinner
                 style="border:1px solid #efefef; border-right: 3px;"></q-img>
        </div>
        <div class="col-8 text-right">

          <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="deleteTab(tab)">
            <q-tooltip>Delete this tab from this list!</q-tooltip>
          </q-btn>

        </div>
      </div>

    </q-card-section>


  </q-card>
</template>

<script setup lang="ts">

import {Tab, UrlExtension} from "src/models/Tab"
import TabsetService from "src/services/TabsetService"
import {useNotificationsStore} from "stores/notificationsStore"
import {ref} from "vue"
import NavigationService from "src/services/NavigationService"
import MHtmlService from "src/services/MHtmlService"
import {useQuasar} from "quasar"
import TabFaviconWidget from "src/components/widgets/TabFaviconWidget.vue"
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";

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
const $q = useQuasar()
const emits = defineEmits(['sendCaption'])
const thumbnails = ref<Map<string, string>>(new Map())

const thumbnailFor = (tab: Tab): string => {
  if (tab.extension === UrlExtension.IMAGE) {
    return tab.chromeTab.url || 'favicon-unknown-32x32.png'
  }
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


const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title
const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

function deleteTab(tab: Tab) {
 // NavigationService.closeTab(tab)

  useCommandExecutor()
    .executeFromUi(new DeleteTabCommand(tab))

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
