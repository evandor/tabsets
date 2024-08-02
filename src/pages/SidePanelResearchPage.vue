<template>

  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 54px">

    <div class="q-ma-none">

      <div class=" q-ma-xs">
        <div class="row q-ma-none q-pa-none">
          <div class="col-7 text-subtitle-1 text-bold">
            Active Project
          </div>
          <div class="col-5 text-blue-10 text-underline cursor-pointer text-right" @click="router.push('/sidepanel')">
            Back to Project&nbsp;
          </div>
        </div>
      </div>
      <div class="ellipsis text-caption q-ml-md q-ma-xs">
        {{ useTabsetsStore().currentTabsetName }}
      </div>

      <div class="text-subtitle-1 q-ma-xs text-bold">
        Source:
      </div>
      <div class="ellipsis text-caption cursor-pointer q-ml-md q-ma-xs" @click="openURL(source?.url || '')">
        {{ source?.url }}
      </div>

      <template v-for="(md,index) in metadatas">

        <PngViewHelper :pngId="md.sourceId"
                       :created="md.created"
                       :index="index"
                       :tabId="source?.id || 'unknown'"
                       :extension="md.type"
                       @new-snapshot-was-clicked="view = 'start_research'"
        />

        <div class="row q-ma-sm q-ml-lg" v-for="a in md.annotations">
          <div class="col-9 ellipsis text-caption text-blue-10 cursor-pointer" @click="toggleEditAnnotation(a,index)">
            {{ a.title }}
            <q-tooltip v-if="a.comment" class="tooltip-small">{{ a.comment }}</q-tooltip>
          </div>
          <div class="col-3 ellipsis">
            <template
              v-if="showAnnotationMenu()">
              <q-icon name="o_visibility" class="cursor-pointer" @click="restoreAnnotation(a)">
                <q-tooltip class="tooltip-small">Show Annotation in Page</q-tooltip>
              </q-icon>
              <q-icon name="o_edit" class="cursor-pointer" @click="toggleEditAnnotation(a,index)">
                <q-tooltip class="tooltip-small">Edit Annotation</q-tooltip>
              </q-icon>
              <q-icon name="o_delete" class="q-ma-none cursor-pointer" size="xs" @click="deleteAnnotation(a, index)">
                <q-tooltip class="tooltip-small">Delete Annotation from Page</q-tooltip>
              </q-icon>
            </template>
          </div>

          <div class="col-12">

            <SourcePageAnnotation
              v-if="currentSelectionText && currentSelectionId === a.id"
              :key="randomKey"
              :metadata="metadatas[currentSelectionIndex]"
              :source-id="sourceId"
              :selectionId="currentSelectionId"
              :selectionText="currentSelectionText"
              :selection="currentSelection"
              :selectionViewPort="currentSelectionViewPort"
              :selectionRect="currentSelectionRect"
              :selectionTitle="currentSelectionTitle || ''"
              :selectionRemark="currentSelectionRemark"
              @set-annotations="(as: Annotation[]) => setAnnotations(as)"
              @close-view="currentSelectionText = undefined"
            />
          </div>

        </div>

        <div class="q-ma-sm">
          <SourcePageAnnotation v-if="currentSelectionText && !currentSelectionId"
                                :key="randomKey"
                                :metadata="metadatas[currentSelectionIndex]"
                                :source-id="sourceId"
                                :selectionText="currentSelectionText"
                                :selectionTitle="currentSelectionTitle"
                                :selection="currentSelection"
                                :selectionViewPort="currentSelectionViewPort"
                                :selectionRect="currentSelectionRect"
                                :selectionRemark="currentSelectionRemark"
                                @set-annotations="(as: Annotation[]) => setAnnotations(as)"
                                @close-view="currentSelectionText = undefined"
          />
        </div>
      </template>

      <template v-if="!metadatas || metadatas.length === 0">
        <div class="q-ma-md text-body2">
          A research session will save a snapshot of the current page where you can start
          annotating text selections.
        </div>
        <q-btn
          unelevated rounded class="q-mx-md q-px-lg" color="primary" label="+ Start Research session"
          @click="saveMHtml(source as Tab)"/>

      </template>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper title="Bibbly"/>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/core/utils/google-analytics";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import _ from "lodash"
import {useRoute, useRouter} from "vue-router";
import Command from "src/core/domain/Command";
import PngViewHelper from "pages/sidepanel/helper/PngViewHelper.vue";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {Tabset} from "src/tabsets/models/Tabset";
import {Tab} from "src/tabsets/models/Tab";
import {SaveMHtmlCommand} from "src/snapshots/commands/SaveMHtmlCommand";
import {openURL, uid} from "quasar";
import {Annotation} from "src/snapshots/models/Annotation";
import {useUtils} from "src/core/services/Utils";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import SourcePageAnnotation from "src/pages/helper/SourcePageAnnotation.vue";
import {SavePngCommand} from "src/snapshots/commands/SavePngCommand";
import {SaveHtmlCommand} from "src/snapshots/commands/SaveHtmlCommand";

const router = useRouter()
const route = useRoute()

const {sendMsg} = useUtils()

const sourceId = ref('')
const source = ref<Tab | undefined>(undefined)
const metadatas = ref<BlobMetadata[]>([])
const currentSelectionText = ref<string | undefined>(undefined)
const currentSelectionViewPort = ref<object | undefined>(undefined)
const currentSelectionRect = ref<object | undefined>(undefined)
const currentSelection = ref<object | undefined>(undefined)
const currentSelectionRemark = ref<string | undefined>(undefined)
const currentSelectionTitle = ref<string | undefined>(undefined)
const currentSelectionColor = ref<string | undefined>('grey')
const currentSelectionId = ref<string | undefined>(undefined)
const currentSelectionIndex = ref<number>(0)
const view = ref('default')
const randomKey = ref<string>(uid())

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //console.log(" <<< received message", message)
  function getTitleSuggestion(input: string) {
    return input.length > 20 ? input.substring(0, 17) + "..." : input;
  }

  if (message.name === "text-selection") {
    console.log(" <<< received message", message)
    const split: string[] = message.data.text ? (message.data.text as string).split(" ") : []
    let titleSuggestion = undefined
    switch (split.length) {
      case 1:
        titleSuggestion = getTitleSuggestion(split[0])
        break
      case 2:
        titleSuggestion = getTitleSuggestion(split[0] + " " + split[1])
        break
      case 3:
        titleSuggestion = getTitleSuggestion(split[0] + " " + split[1] + " " + split[2])
        break
      default:
        titleSuggestion = message.data.text.length > 40 ? message.data.text.substring(0, 37) + "..." : message.data.text
        break
    }

    currentSelectionId.value = undefined
    currentSelectionTitle.value = titleSuggestion
    currentSelectionText.value = message.data.text
    currentSelection.value = message.data.selection
    currentSelectionViewPort.value = message.data.viewPort
    currentSelectionRect.value = message.data.rect
    currentSelectionRemark.value = undefined
    randomKey.value = uid()
  }
})

const setAnnotations = (as: Annotation[]) => {
  as.forEach((a: Annotation) => {
    console.log("found annotation", a)
    // restoreSelection(a.selection)
    // restoreSelection(JSON.parse(JSON.stringify(a.selection)))
  })
  currentSelectionText.value = undefined
  currentSelectionId.value = undefined
  //annotations.value =
  if (metadatas.value[0]) {
    metadatas.value[0].annotations = as
  }
}

const restoreAnnotation = (a: Annotation) => {
  console.log("restoring selection", a.selection)
  // restoreSelection(a.selection)
  sendMsg('restore-selection', {selection: a.selection, color: a.color, rect: a.rect, viewport: a.viewport})
}

const toggleEditAnnotation = (a: Annotation, i: number) => {
  if (currentSelectionId.value) {
    currentSelectionId.value = undefined
    currentSelectionText.value = undefined
  } else {
    console.log("edit annotation", a, i)
    currentSelectionId.value = a.id
    currentSelectionIndex.value = i
    currentSelectionText.value = a.text
    currentSelectionTitle.value = a.title
    currentSelectionRemark.value = a.comment
    currentSelectionColor.value = a.color
    currentSelection.value = a.selection
    restoreAnnotation(a)
  }

}

const deleteAnnotation = async (a: Annotation, i: number) => {
  if (source.value) {
    const as = await useSnapshotsStore().deleteAnnotation(source.value.id, a, i)
    setAnnotations(as)
  }
}

const updateBlobs = () => {
  if (source.value?.id) {
    useSnapshotsService().getMetadataFor(source.value.id)
      .then((md: BlobMetadata[]) => {
        metadatas.value = md
      })
  }
}


onMounted(async () => {
  Analytics.firePageViewEvent('SidePanelSourcePage', document.location.href);
})

watchEffect(async () => {
  sourceId.value = route.params.sourceId as string
  console.log("sourceId", sourceId.value)

  // TODO
  source.value = _.find(
    _.flatMap(
      [...useTabsetsStore().tabsets.values()] as Tabset[],
      (ts: Tabset) => ts.tabs),
    (s: Tab) => s.id === sourceId.value)
  updateBlobs()
  if (source.value) {
    const mds = await useSnapshotsStore().metadataFor(source.value.id)
    if (mds) {
      mds.forEach((md: BlobMetadata) => {
        setAnnotations(md.annotations)
      })
    }
  }
})

watchEffect(() => {
  if (useSnapshotsStore().lastUpdate) {
    console.log("updating!")
    updateBlobs()
  }
})

// watchEffect(() => {
//   projects.value = useProjectsStore().projects
//   projectOptions.value = []
//   _.forEach(projects.value as Project[], (p: Project) => {
//     projectOptions.value.push({label: p.name, value: p.id})
//   })
//   projectOptions.value = _.sortBy(projectOptions.value, "label")
//   projectOptions.value.push({
//     label: 'Create new Project', value: 'new_project'
//   })
//   // if (projects.value.length === 0) {
//   //   console.log("no projects, redirecting to welcome page")
//   //   router.push("/sidepanel/welcome")
//   // }
// })

const saveHtml = (source: Tab | undefined) => {
  console.log("saving html for", source)
  if (source) {
    chrome.tabs.query({currentWindow: true})
      .then((tabs: chrome.tabs.Tab[]) => {
        const tabCandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === source.url)
        if (tabCandidates.length > 0) {
          const saveHtmlCommand: Command<any> = new SaveHtmlCommand(source.id, source.url || '')
          useCommandExecutor().execute(saveHtmlCommand)
          updateBlobs()
        }
      })
  }
}

const saveMHtml = (source: Tab | undefined) => {
  console.log("saving mhtml for", source)
  if (source && source.url) {
    useCommandExecutor().executeFromUi(new SaveMHtmlCommand(source.id, source.url))
      .then(() => {
        //view.value = 'default'
        openMhtml()
      })
    useCommandExecutor().execute(new SavePngCommand(source.id, source.url))

  }
}

const showAnnotationMenu = () => {
  const sessionUrl = chrome.runtime.getURL(`www/index.html#/mainpanel/${BlobType.MHTML}/${source.value?.id}/0`)
  const currentUrl = useTabsStore2().currentChromeTab?.url
  return currentUrl?.toLowerCase() === sessionUrl.toLowerCase()
}

const openMhtml = () => window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/${BlobType.MHTML}/${source.value?.id}/0`));

// const createClipping = () => {
//
//   const tabId = useTabsStore2().currentChromeTab?.id
//   console.log("got tabid", tabId)
//   if (tabId) {
//     ChromeApi.executeClippingJS(tabId)
//   }
// }
</script>

<style scoped>
.fitpage {
  height: calc(100vh - 200px);
}
</style>
