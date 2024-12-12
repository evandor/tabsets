<template>

  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 60px">

    <offline-info/>

    <!-- white main box -->
    <div class="column fitpage q-pa-sm q-mx-sm q-mt-md bg-white">
      <div class="col" style="max-width:100%;">

        <div class="row q-ma-none q-pa-none items-start">
          <div class="col-6">
              <span @click="router.push('/sidepanel')" class="cursor-pointer">
                <q-icon name="turn_left" color="primary" class="q-mr-sm"/>Back to Collection
              </span>
          </div>
          <div class="col-6 text-right">
             &nbsp;
          </div>
          <div class="col-12">
            <hr style="height:1px;border:none;background-color: #efefef;">
          </div>
        </div>

        <div class="text-subtitle-1 q-ma-xs text-bold" v-if="source">
          <PanelTabListElementWidget :key="'ptlew__' + source?.id"
                                     :tab="source"
          />
        </div>

        <!--        <div class="text-subtitle-1 q-ma-xs text-bold">-->
        <!--          Source:-->
        <!--        </div>-->
        <!--        <div class="ellipsis text-caption cursor-pointer q-ml-md q-ma-xs" @click="openURL(source?.url || '')">-->
        <!--          {{ source?.url || '...' }}-->
        <!--        </div>-->
        <!--        <div class="text-subtitle-1 q-ma-xs text-bold">-->
        <!--          Tab:-->
        <!--        </div>-->
        <!--        <div class="ellipsis text-caption cursor-pointer q-ml-md q-ma-xs">-->
        <!--          {{ useTabsStore2().currentChromeTab?.url || '...' }}-->
        <!--        </div>-->

        <div class="q-ma-none q-pa-none q-mt-lg">
          <q-tabs
            v-model="tab"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            no-caps
            narrow-indicator>
            <q-tab name="metadata" label="Metadata"/>
            <q-tab name="snapshots" :label="snapshotsLabel()"/>
            <q-tab name="alerts" label="Alerts"/>
          </q-tabs>

          <q-separator/>

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="metadata">

              <div class="row q-ma-none q-pa-none">
                <div class="col-12 text-center q-my-lg">
                  <q-img :src="thumbnail" style="border:1px dotted grey;border-radius: 5px;max-width:230px"
                         no-native-menu/>
                </div>

                <template v-for="[k,v] of ogMetadata()">
                  <div class="col-3 ellipsis text-subtitle2">
                    {{ k }}
                  </div>
                  <div class="col-9 ellipsis-2-lines text-right">
                    {{ v }}
                  </div>

                </template>


              </div>
              <!--              created: {{ source?.created }}<br>-->
              <!--              Description: {{ source?.description }}<br>-->


            </q-tab-panel>

            <q-tab-panel name="snapshots">

              <div class="text-center">
                <q-btn-dropdown :loading="snapshotLoading" class="q-ma-none q-px-md" color="primary" dense no-caps
                                label="New Snapshot...">
                  <q-list>
                    <q-item clickable v-close-popup @click="saveHtml(source as Tab)">
                      <q-item-section>
                        <q-item-label>as Html</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="saveMHtml(source as Tab)">
                      <q-item-section>
                        <q-item-label>as MHtml</q-item-label>
                      </q-item-section>
                    </q-item>
<!--                    <q-item clickable v-close-popup @click="savePng(source as Tab)">-->
<!--                      <q-item-section>-->
<!--                        <q-item-label>as Image</q-item-label>-->
<!--                      </q-item-section>-->
<!--                    </q-item>-->
<!--                    <q-item clickable v-close-popup @click="savePdf(source as Tab)">-->
<!--                      <q-item-section>-->
<!--                        <q-item-label>as PDF</q-item-label>-->
<!--                      </q-item-section>-->
<!--                    </q-item>-->
<!--                    <q-item clickable v-close-popup @click="saveWArch(source as Tab)">-->
<!--                      <q-item-section>-->
<!--                        <q-item-label>as Web Archive</q-item-label>-->
<!--                      </q-item-section>-->
<!--                    </q-item>-->
                  </q-list>
                </q-btn-dropdown>
              </div>

              <!--              <div class="text-subtitle-1 q-ma-xs text-bold q-mt-lg">-->
              <!--                Create new Research Snapshot as:-->
              <!--              </div>-->
              <!--              <div class="cursor-pointer q-ml-md q-ma-xs q-mb-lg">-->
              <!--                <q-btn :disable="wrongTabOpen" label="Image" class="bg-white q-mr-xs" size="xs" @click="savePng(source as Tab)"/>-->
              <!--                <q-btn :disable="wrongTabOpen" label="PDF" class="bg-white q-mr-xs" size="xs" @click="savePdf(source as Tab)"/>-->
              <!--                <q-btn :disable="wrongTabOpen" label="HTML" class="bg-white q-mr-xs" size="xs" @click="saveHtml(source as Tab)"/>-->
              <!--                <q-btn :disable="wrongTabOpen" label="MHTML" class="bg-white q-mr-xs" size="xs" @click="saveMHtml(source as Tab)"/>-->
              <!--                <q-btn :disable="wrongTabOpen" label="WArc" class="bg-white q-mr-xs" size="xs" @click="saveWArch(source as Tab)"/>-->
              <!--                <q-btn v-if="wrongTabOpen" label="open Page" class="bg-white q-mr-xs" size="xs" @click="openURL(source?.url || '')"/>-->
              <!--              </div>-->

              <template v-for="(md,index) in metadatas">

                <SnapshotViewHelper
                  :snapshotId="md.id"
                  :created="md.created"
                  :extension="md.type"
                  :wasEdited="editedSnapshot ? editedSnapshot.snapshotId === md.id : false"
                  @save-snapshot="saveSnapshot"
                  @new-snapshot-was-clicked="view = 'start_research'"
                />

                <div class="row q-ma-sm q-ml-lg" v-for="a in md.annotations">
                  <div class="col-9 ellipsis text-caption text-accent cursor-pointer"
                       @click="toggleEditAnnotation(a,index)">
                    {{ a.title }}
                    <q-tooltip v-if="a.comment" class="tooltip-small">{{ a.comment }}</q-tooltip>
                  </div>
                  <div class="col-3 ellipsis">
                    <template
                      v-if="showAnnotationMenu(md.id)">
                      <q-icon name="o_visibility" class="q-mr-md cursor-pointer" @click="restoreAnnotation(a)">
                        <q-tooltip class="tooltip-small">Show Annotation in Page</q-tooltip>
                      </q-icon>
                      <q-icon name="o_delete" class="q-mr-md cursor-pointer" size="11px"
                              @click="deleteAnnotation(md, a)">
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
                      :snapshotId="currentSnapshotId"
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
                                        :snapshotId="currentSnapshotId"
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


            </q-tab-panel>

            <q-tab-panel name="alerts">
              <div class="text-h6">Website Alerts</div>
              To be done
            </q-tab-panel>
          </q-tab-panels>
        </div>


      </div>
    </div>


    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper2 :title="'Project ' + useTabsetsStore().currentTabsetName || 'Tabsets'"/>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import FirstToolbarHelper2 from "pages/sidepanel/helper/FirstToolbarHelper2.vue";
import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/core/utils/google-analytics";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import _ from "lodash"
import {useRoute, useRouter} from "vue-router";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {BlobMetadata, BlobType} from "src/snapshots/models/BlobMetadata";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {Tabset} from "src/tabsets/models/Tabset";
import {Tab} from "src/tabsets/models/Tab";
import {SaveMHtmlCommand} from "src/snapshots/commands/SaveMHtmlCommand";
import {uid} from "quasar";
import {Annotation} from "src/snapshots/models/Annotation";
import {useUtils} from "src/core/services/Utils";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import SourcePageAnnotation from "src/pages/helper/SourcePageAnnotation.vue";
import {SavePngCommand} from "src/snapshots/commands/SavePngCommand";
import SnapshotViewHelper from "pages/sidepanel/helper/SnapshotViewHelper.vue";
import {SavePdfCommand} from "src/snapshots/commands/SavePdfCommand";
import {SaveWarcCommand} from "src/snapshots/commands/SaveWarcCommand";
import {SaveHtmlCommand} from "src/snapshots/commands/SaveHtmlCommand";
import OfflineInfo from "src/core/components/helper/offlineInfo.vue";
import PanelTabListElementWidget from "src/tabsets/widgets/PanelTabListElementWidget.vue";
import {useThumbnailsService} from "src/thumbnails/services/ThumbnailsService";
import {useContentService} from "src/content/services/ContentService";
import {ContentItem} from "src/content/models/ContentItem";
import {EditedSnapshot} from "src/snapshots/models/EditedSnapshot";

const router = useRouter()
const route = useRoute()

const {sendMsg} = useUtils()

const sourceId = ref('')
const source = ref<Tab | undefined>(undefined)
const metadatas = ref<BlobMetadata[]>([])

const currentSnapshotId = ref<string | undefined>(undefined)
const snapshotLoading = ref(false)

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
const openTabMatch = ref<Map<string, boolean>>(new Map())
const wrongTabOpen = ref(true)
const tab = ref('metadata')
const thumbnail = ref('')
const content = ref<ContentItem | undefined>(undefined)
const editedSnapshot = ref<EditedSnapshot | undefined>(undefined)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //console.log(" <<< received message", message)
  function getTitleSuggestion(input: string) {
    return input.length > 20 ? input.substring(0, 17) + "..." : input;
  }

  if (message.name === "text-selection") {
    //console.log(" <<< received message", message)
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

    currentSnapshotId.value = message.data.snapshotId
    currentSelectionId.value = undefined
    currentSelectionTitle.value = titleSuggestion
    currentSelectionText.value = message.data.text
    currentSelection.value = message.data.selection
    currentSelectionViewPort.value = message.data.viewPort
    currentSelectionRect.value = message.data.rect
    currentSelectionRemark.value = undefined
    randomKey.value = uid()
  } else if (message.name === "snapshot-edited") {
    console.log(" <<< received message", message)
    // #/mainpanel/HTML/45adbe60-0169-4bc9-ac4b-74aecac5625d?edit=true
    const path = message.data.path
    const pathSplit = path.split('?')[0].split("/")
    const snapshotId = pathSplit[pathSplit.length-1]
    console.log("snapshotId", snapshotId)
    if (snapshotId) {
      useSnapshotsService().getMetadataById(snapshotId)
        .then((metadata: BlobMetadata | undefined) => {
          console.log("metadata", metadata)
          editedSnapshot.value = new EditedSnapshot(snapshotId, metadata!.sourceId, metadata!.url, message.data.html)
        })
    } else {
      editedSnapshot.value = undefined
    }
  }
})

onMounted(async () => {
  Analytics.firePageViewEvent('SidePanelResearchPage', document.location.href);
})

watchEffect(() => {
  const currentUrl = useTabsStore2().currentChromeTab?.url
  wrongTabOpen.value = currentUrl !== source.value?.url
  // console.log("currentUrl", currentUrl)
  for (const md of metadatas.value) {
    openTabMatch.value.set(md.id, false)
    const sessionUrl = chrome.runtime.getURL(`www/index.html#/mainpanel/${BlobType.MHTML}/${md.id}`)
    if (currentUrl?.toLowerCase() === sessionUrl.toLowerCase()) {
      openTabMatch.value.set(md.id, true)
    }
  }
  // console.log("1", sessionUrl)
  // console.log("2", currentUrl, currentUrl?.toLowerCase() === sessionUrl.toLowerCase())
  //return
})

watchEffect(() => {
  if (source.value) {
    useThumbnailsService().getThumbnailFor(source.value.id)
      .then(data => {
        if (data) {
          thumbnail.value = data
        } else {
          thumbnail.value = ''
        }
      })
  }
})

watchEffect(() => {
  if (source.value && source.value.url) {
    useContentService().getContent(source.value.id)
      .then((data: ContentItem | undefined) => {
        content.value = data
      })
  }
})

const updateBlobs = () => {
  if (source.value?.id) {
    useSnapshotsService().getMetadataFor(source.value.id)
      .then((mds: BlobMetadata[]) => {
        console.log("setting metatdatas", mds.length)
        metadatas.value = _.sortBy(mds, "created")
      })
  }
}

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
    console.log("got", mds)
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

const deleteAnnotation = async (md: BlobMetadata, a: Annotation) => {
  if (source.value) {
    const as = await useSnapshotsStore().deleteAnnotation(md.id, a)
    setAnnotations(as)
  }
}

const saveHtml = (source: Tab | undefined) => {
  console.log("saving html for", source)
  if (source && source.url) {
    useCommandExecutor().executeFromUi(new SaveHtmlCommand(source.id, source.url))
  }
}

const saveMHtml = (source: Tab | undefined) => {
  console.log("saving mhtml for", source)
  if (source && source.url) {
    useCommandExecutor().executeFromUi(new SaveMHtmlCommand(source.id, source.url))
  }
}

const saveWArch = (source: Tab | undefined) => {
  console.log("saving Warc for", source)
  if (source && source.url) {
    useCommandExecutor().executeFromUi(new SaveWarcCommand(source.id, source.url))
  }
}

const savePng = (source: Tab | undefined) => {
  console.log("saving png for", source)
  if (source && source.url) {
    useCommandExecutor().executeFromUi(new SavePngCommand(source.id, source.url))
  }
}

const savePdf = (source: Tab | undefined) => {
  console.log("saving PDF for", source)
  if (source && source.url) {
    useCommandExecutor().executeFromUi(new SavePdfCommand(source.id, source.url))
  }
}

const showAnnotationMenu = (mdId: string) => {
  return openTabMatch.value.get(mdId)
}

const snapshotsLabel = () => `Snapshots (${metadatas.value.length})`

const ogMetadata = () => {
  const result: Map<string, string> = new Map()
  if (content.value && content.value.metas) {
    const ogKeys = _.filter(Object.keys(content.value.metas), (key: string) => key.toLowerCase().startsWith('og:'))
    // console.log("ogKeys", ogKeys)
    for (const k of ogKeys) {
      result.set(k.substring(3), content.value.metas[k as keyof object])
    }
  }
  return result
}

const saveSnapshot = async () => {
  //console.log("saving", editedSnapshot.value)
  if (editedSnapshot.value) {
    console.log("saving", editedSnapshot.value)
    await useSnapshotsService().saveEditedHTML(editedSnapshot.value!.sourceId, editedSnapshot.value!.url, editedSnapshot.value!.html)
  }
}
</script>

<style scoped>
.fitpage {
  height: calc(100vh - 200px);
}
</style>
