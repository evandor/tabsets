<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary">

    <q-toolbar-title>
      {{ suggestion?.state === SuggestionState.NOTIFICATION ? 'Notification' : 'Suggestion' }}
    </q-toolbar-title>

  </q-toolbar>


  <div class="q-pa-md q-gutter-sm">
    <!--    <q-banner rounded class="bg-grey-1 text-primary">-->
    <!--      Suggestions Info text: TODO-->
    <!--    </q-banner>-->

    <div class="row items-baseline q-ma-md">
      <div class="col-3 text-bold">
        Title
      </div>
      <div class="col-9">
        {{ suggestion?.title }}
      </div>
    </div>

    <div class="row q-mt-none q-pt-none q-ma-md">
      <div class="col-3 text-bold">
        &nbsp;
      </div>
      <div class="col-9 text-caption text-grey">
        {{ date.formatDate(suggestion?.created, 'DD.MM.YYYY HH:mm') }}
      </div>
    </div>

    <div class="row items-baseline q-ma-md">
      <div class="col-3 text-bold">
        Messsage
      </div>
      <div class="col-9">
        {{ suggestion?.msg }}
      </div>
    </div>
    <div class="row items-baseline q-ma-md" v-if="suggestion?.data['url' as keyof object]">
      <div class="col-3 text-bold">
        URL
      </div>
      <div class="col-9 text-blue cursor-pointer">
        <div @click="NavigationService.openOrCreateTab([suggestion?.data['url' as keyof object]])">
          {{ suggestion?.data['url' as keyof object] }}
        </div>
      </div>
    </div>

    <template v-if="suggestion?.type?.toUpperCase() === 'REDIRECT_HAPPENED_FOR_BOOKMARK'">

      <div class="row items-baseline q-ma-md">
        <div class="col-3 text-bold">
          Got Response Code
        </div>
        <div class="col-9">
          {{ suggestion?.data.status }}
        </div>
        <div class="col-3 text-bold">
          Suggestinng: Replace
        </div>
        <div class="col-9">
          {{ suggestion?.data.url }}
        </div>
        <div class="col-3 text-bold">
          with
        </div>
        <div class="col-9">
          {{ suggestion?.data.location }}
        </div>
      </div>
    </template>

    <template v-if="suggestion?.type === SuggestionType.CONTENT_CHANGE">
      <div class="row">
        <div class="col-4 q-pr-xs">
          <q-scroll-area style="height: 630px; width:100%;"
                         visible
                         :thumb-style="thumbStyle"
                         :bar-style="barStyle"
                         class="col"
                         ref="firstRef"
                         @scroll="onScrollFirst">
            <div class="row no-wrap">
              <img id="monitoringStartImg">
            </div>
          </q-scroll-area>
        </div>
        <div class="col-4 q-pr-xs" v-if="pngs.length === 1">
          <q-btn label="Click to compare with current website" @click="createImageToCompare()"/>
          <div class="text-caption q-mt-lg">
            This will open a new tab, load the current version of the monitored website and
            create an image which will be compared to the older snapshot.
          </div>
        </div>
        <div class="col-4" v-else>
          <q-scroll-area
              visible
              :thumb-style="thumbStyle"
              :bar-style="barStyle"
              style="height: 100%"
              class="col"
              ref="secondRef"
              @scroll="onScrollSecond">
            <div class="row no-wrap">
              <img id="monitoringSnapshotImg">
            </div>
          </q-scroll-area>
        </div>
        <div class="col-4">
          <q-scroll-area
              visible
              :thumb-style="thumbStyle"
              :bar-style="barStyle"
              style="height: 100%"
              class="col"
              ref="thirdRef"
              @scroll="onScrollThird">
            <div class="row no-wrap">
              <canvas id="diffCanvas"/>
            </div>
          </q-scroll-area>



        </div>
      </div>
    </template>

    <div class="row items-baseline q-ma-md">
      <div class="col-3 text-bold">

      </div>
      <div class="col-9">

        <template v-if="!decided">
          <q-btn label="Ignore" class="q-mr-md" size="sm" @click="ignoreSuggestion()">
            <q-tooltip class="tooltip-small" :delay="500">Ignore this suggestion</q-tooltip>
          </q-btn>
          <q-btn label="Apply Suggestion"
                 size="sm" color="warning" @click="applySuggestion"></q-btn>
        </template>
        <template v-else>
          <q-btn label="Close Window" class="q-mr-md" size="sm" @click="closeWindow()"/>
        </template>
      </div>
    </div>

<!--    <template v-if="useSettingsStore().isEnabled('dev')">-->
<!--      <div class="row" v-for="s in useSuggestionsStore().getSuggestions([-->
<!--          SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.CHECKED, SuggestionState.IGNORED,-->
<!--          SuggestionState.NOTIFICATION, SuggestionState.INACTIVE])">-->
<!--        <pre>{{ s }}</pre>-->
<!--      </div>-->
<!--    </template>-->


  </div>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/utils/google-analytics";
import {useRoute} from "vue-router";
import {date} from "quasar";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {Suggestion, SuggestionState, SuggestionType} from "src/models/Suggestion";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {ApplySuggestionCommand} from "src/domain/suggestions/ApplySuggestionCommand";
import {IgnoreSuggestionCommand} from "src/domain/suggestions/IgnoreSuggestionCommand";
import {useSettingsStore} from "stores/settingsStore";
import NavigationService from "src/services/NavigationService";
import PdfService from "src/services/PdfService";
import ContentUtils from "src/utils/ContentUtils";
import {Tab} from "src/models/Tab";
import {SavedBlob} from "src/models/SavedBlob";
import pixelmatch from "pixelmatch";
// @ts-ignore
import {PNG} from "pngjs/browser";

import {Buffer} from 'buffer/'

const route = useRoute()

const suggestionId = ref<string | undefined>(undefined)
const suggestion = ref<Suggestion | undefined>(undefined)
const pngs = ref<SavedBlob[]>([])
const decided = ref(false)
const firstRef = ref(null)
const secondRef = ref(null)
const thirdRef = ref(null)
const diff = ref<PNG | undefined>(undefined)

const thumbStyle = ref({right: '4px', borderRadius: '7px', backgroundColor: '#027be3', width: '4px', opacity: 0.75})
const barStyle = ref({right: '2px', borderRadius: '9px', backgroundColor: 'white', width: '8px', opacity: 0.2})

let ignoreSource: string | null = null

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelTabAssignmentPage', document.location.href);
})

watchEffect(() => {
  if (diff.value) {
    console.log("got diff", diff)
  }
})

watchEffect(async () => {
  suggestionId.value = route.params.suggestionId as string
  if (suggestionId.value) {
    suggestion.value = useSuggestionsStore().getSuggestion(suggestionId.value)
    console.log("got suggestion", suggestion.value)
    if (suggestion.value) {
      const tabId = suggestion.value['data' as keyof object]['tabId' as keyof object]
      console.log("got tabId", tabId)
      pngs.value = await PdfService.getPngsForTab(tabId)
      console.log("pngs", pngs.value)

      var urlCreator = window.URL || window.webkitURL;
      var imageUrl = urlCreator.createObjectURL(pngs.value[0].content);
      console.log("imageUrl", imageUrl)
      const img1: HTMLImageElement | null = document.querySelector("#monitoringStartImg")
      if (img1) {
        img1.src = imageUrl;
        img1.onload = function () {
          var w = img1.width;
          var h = img1.height;
          console.log("NEW IMAGE width", w);
          console.log("NEW IMAGE height: ", h);
        }
      }

      if (pngs.value.length > 1) {
        var imageUrl2 = urlCreator.createObjectURL(pngs.value[1].content);
        console.log("imageUrl2", imageUrl2)
        const img2: HTMLImageElement | null = document.querySelector("#monitoringSnapshotImg")
        if (img2) {
          img2.src = imageUrl2;
          img2.onload = function () {
            var w = img2.width;
            var h = img2.height;
            console.log("NEW IMAGE width2", w);
            console.log("NEW IMAGE height2: ", h);


            // const img1 = img1Context.getImageData(0, 0, width, height);
            // const img2 = img2Context.getImageData(0, 0, width, height);
            // const diff = diffContext.createImageData(width, height);
            //const buf1: Buffer = img1?.get
            //const myMat: Mat = new Mat(buf, height, width, CV_8UC4);
            const content1: Blob = pngs.value[0].content as Blob
            const content2: Blob = pngs.value[1].content as Blob
            content1.arrayBuffer()
                .then((buf1: ArrayBuffer) => {
                  //console.log("got buf1", ArrayBuffer.isView(buf1))
                  //console.log("got buf1", ArrayBuffer.isView(buf1), buf1.constructor.BYTES_PER_ELEMENT === 1)
                  content2.arrayBuffer()
                      .then((buf2: ArrayBuffer) => {

                        const beforeImg = PNG.sync.read(Buffer.from(buf1))
                        const afterImg = PNG.sync.read(Buffer.from(buf2))

                        console.log("beforeImg:", beforeImg.width, beforeImg.height)
                        console.log("afterImg: ", afterImg.width, afterImg.height)
                        //console.log("got buf1", Buffer.from(buf2).length, img2.width * img2.height * 4)
                        //pixelmatch(img1, img2, diff.data, img2.width, img2.height, {threshold: 0.1});
                        if (beforeImg.width === afterImg.width && beforeImg.height === afterImg.height) {
                          const width = beforeImg.width
                          const height = beforeImg.height
                          //const d = new PNG({width, height});
                          const canvas: HTMLCanvasElement | null = document.getElementById("diffCanvas") as HTMLCanvasElement
                          if (canvas) {
                            canvas.height = height
                            canvas.width = width
                            const ctx = canvas.getContext("2d");
                            //const imgData = ctx?.createImageData(100, 100);
                            const d:ImageData | undefined = ctx?.createImageData(width, height);
                            if (d) {
                              const numDiffPixels = pixelmatch(beforeImg.data, afterImg.data, d.data, img2.width, img2.height, {
                                threshold: 0.1,
                              });
                              ctx?.putImageData(d,0,0)
                              console.log("###", numDiffPixels);
                            }

                          }
                        }

                      })
                })


            //diffContext.putImageData(diff, 0, 0);
          }
        }
      }

      return "chrome-extension://pndffocijjfpmphlhkoijmpfckjafdpl/www/index.html#/mainpanel/mhtml/7b961cb4-243f-430a-b28e-0e9421febdc2"
    }
  }
})

const closeWindow = () => window.close()

const applySuggestion = () => {
  if (suggestion.value) {
    useCommandExecutor().executeFromUi(new ApplySuggestionCommand(suggestion.value))
        .then(() => decided.value = true)
  }
}

const ignoreSuggestion = () => {
  if (suggestion.value) {
    useCommandExecutor().executeFromUi(new IgnoreSuggestionCommand(suggestion.value))
        .then(() => decided.value = true)
  }
}

const oldSnapshot = () => {
  return "chrome-extension://pndffocijjfpmphlhkoijmpfckjafdpl/www/index.html#/mainpanel/mhtml/7b961cb4-243f-430a-b28e-0e9421febdc2"
}

const oldPng = async () => {

}

const createImageToCompare = async () => {
  if (suggestion.value?.url) {
    //NavigationService.openOrCreateTab([suggestion.value?.url], undefined, undefined, true)
    const tempTab = await chrome.tabs.create({
      active: true,
      pinned: false,
      url: suggestion.value?.url
    })
    console.log("created temporary tab", suggestion.value?.url, tempTab)

    setTimeout(() => {

      if (tempTab && tempTab.id) {
        chrome.tabs.sendMessage(
            tempTab.id,
            "getContent",
            {},
            (res) => {
              console.log("getContent returned result with length", res?.content?.length)
              let html = ContentUtils.setBaseHref(suggestion.value?.url || '', res.content)
              return PdfService.screenshotFrom(html)
                  .then((res: any) => {
                    console.log("res", res, typeof res)
                    console.log("res2", typeof res.data)
                    const tab = new Tab(suggestion.value?.data['tabId' as keyof object] || '', tempTab)
                    PdfService.saveBlob(tab, res.data, 'PNG', 'monitoring snapshot')
                    setTimeout(() => chrome.tabs.remove(tempTab.id || 0), 2000)
                  }).catch((err: any) => {
                    //return handleError(err)
                    console.log("got error", err)
                    setTimeout(() => chrome.tabs.remove(tempTab.id || 0), 2000)
                  })
            })
      }
    }, 2000)
  }
}

function scroll(source: any, position: any) {
  if (ignoreSource === source) {
    ignoreSource = null
    return
  }

  ignoreSource = source === 'first'
      ? 'second'
      : source === 'second' ?
          'third' :
          'first'

  if (source === 'first') {
    secondRef.value?.setScrollPosition('vertical', position)
    thirdRef.value?.setScrollPosition('vertical', position)
  } else if (source === 'second') {
    firstRef.value?.setScrollPosition('vertical', position)
    thirdRef.value?.setScrollPosition('vertical', position)
  } else if (source === 'third') {
    firstRef.value?.setScrollPosition('vertical', position)
    secondRef.value?.setScrollPosition('vertical', position)
  }
}


const onScrollFirst = ({verticalPosition}: any) => {
  scroll('first', verticalPosition)
}

const onScrollSecond = ({verticalPosition}: any) => {
  scroll('second', verticalPosition)
}

const onScrollThird = ({verticalPosition}: any) => {
  scroll('third', verticalPosition)
}

</script>
