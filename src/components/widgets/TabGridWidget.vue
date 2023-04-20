<template>
  <q-card flat bordered
          style="border:0px solid green">

    <q-card-section
      class="q-ma-none q-pa-xs cursor-pointer bg-primary text-white"
      style="width:100%;">

      <div class="row items-baseline">

        <q-img v-if="props.tab.image && props.tab.image.startsWith('blob://')"
               style="border:0px dotted white;border-radius:5px"
               :src="imgFromBlob">
          <q-tooltip class="tooltip">Custom Screenshot</q-tooltip>
        </q-img>
        <q-img v-else-if="props.tab.image"
               style="border:0px dotted white;border-radius:5px"
               :src="props.tab.image">
          <q-tooltip class="tooltip">Custom Screenshot</q-tooltip>
        </q-img>
        <q-img v-else-if="thumbnail" style="border:0px dotted white;border-radius:3px"
               :src="thumbnail">
          <q-tooltip class="tooltip">Webpage Thumbnail</q-tooltip>
        </q-img>
      </div>

    </q-card-section>
    <q-card-section class="q-ma-none q-pa-xs bg-primary text-white">

      <div class="row fit">
        <div class="col-12 cursor-pointer ellipsis">
          <TabFaviconWidget :tab="tab" width="16px" height="16px" class="q-mr-sm"/>
          <span @click="NavigationService.openOrCreateTab(props.tab.chromeTab?.url || '')">{{shortUrl()}}</span>
        </div>
      </div>

    </q-card-section>


  </q-card>
</template>

<script setup lang="ts">

import {Tab, UrlExtension} from "src/models/Tab"
import TabsetService from "src/services/TabsetService"
import {useNotificationsStore} from "src/stores/notificationsStore"
import {onMounted, ref, watchEffect} from "vue"
import NavigationService from "src/services/NavigationService"
import MHtmlService from "src/services/MHtmlService"
import {useQuasar} from "quasar"
import TabFaviconWidget from "src/components/widgets/TabFaviconWidget.vue"
import {useCommandExecutor} from "src/services/CommandExecutor";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand"
import {useUtils} from "src/services/Utils"
import {useTabsetService} from "src/services/TabsetService2";

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
const imgFromBlob = ref<string>("")
const thumbnail = ref<string | undefined>(undefined)


onMounted(() => {
  const blobImgPath = props.tab.image
  if (blobImgPath && blobImgPath.startsWith('blob://')) {
    useTabsetService().getBlob(blobImgPath.replace("blob://", ""))
      .then((res) => {
        var reader = new FileReader();
        reader.readAsDataURL(res.content);
        reader.onloadend = function () {
          var base64data = reader.result;
          if (base64data) {
            imgFromBlob.value = base64data.toString()
          }
        }
      })
      .catch((err) => console.error(err))
  }
})



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

const shortUrl = () => {
  if (props.tab.chromeTab.url) {
    return props.tab.chromeTab.url
      .replace("https://www.", "")
      .replace("http://www.", "")
      .replace("https://", "")
      .replace("http://", "")
  }
  return ""
}
const thumbnailFor = async (tab: Tab): Promise<object> => {
  return await TabsetService.getThumbnailFor(tab)
}

watchEffect(() => {
  if (props.tab) {
    // @ts-ignore
    thumbnailFor(props.tab)
      .then((tn: object) => {
        //console.log("tn", tn)
        if (tn && tn['thumbnail' as keyof object]) {
          thumbnail.value = tn['thumbnail' as keyof object]
        }
      })
  }
})

</script>
