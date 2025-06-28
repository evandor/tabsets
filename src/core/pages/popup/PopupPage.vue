<template>
  <!-- PopupPage -->
  <q-page class="darkInDarkMode brightInBrightMode" :style="paddingTop" style="min-width: 400px; max-height: 700px">
    <offline-info />
    <PopupInputLine title="Collection" class="q-mt-md">
      <PopupCollectionSelector
        @tabset-changed="tabsetChanged()"
        :show-tabs-count="!currentTabsetHasFolders()"
        :url="pageModel.url" />
    </PopupInputLine>

    <PopupInputLine title="Folder" v-if="showFolders()">
      <PopupFolderSelector
        @tabset-changed="tabsetChanged()"
        :show-tabs-count="currentTabsetHasFolders()"
        :currentTabset="currentTabset!" />
    </PopupInputLine>

    <!-- Icon, title and description -->
    <div class="row q-ma-sm darkInDarkMode brightInBrightMode q-mt-md">
      <div class="col-2 q-ma-sm">
        <q-img v-if="thumbnail" :src="thumbnail" no-native-menu />
        <q-img v-else :src="browserTab?.favIconUrl" no-native-menu />
      </div>
      <div class="col q-mx-sm">
        <div class="column">
          <div class="col">
            <AutogrowInput
              v-model="pageModel.title"
              :input-class="'text-bold'"
              :class="'ellipsis'"
              :filled="false"
              data-testid="pageModelTitle" />
          </div>
          <div class="col ellipsis-3-lines text-body2">{{ pageModel.description }}</div>
          <!--          <AutogrowInput v-model="pageModel.description" :class="'ellipsis-3-lines'" />-->
        </div>
      </div>
    </div>

    <!-- info label: created, updated, ... -->
    <div class="row q-my-xs" v-if="tab && tab.url == pageModel.url">
      <div class="col text-right text-caption text-grey-8 q-mx-md cursor-pointer" @click="interateThroughInfo">
        {{ infoLabel }}
      </div>
    </div>

    <!-- URL -->
    <PopupInputLine title="URL" class="q-mt-md">
      <AutogrowInput v-model="pageModel.url" :class="'ellipsis'" :filled="true" data-testid="pageModelUrl" />
    </PopupInputLine>

    <!-- Note -->
    <PopupInputLine title="Note">
      <AutogrowInput v-model="pageModel.note" :class="'ellipsis'" :filled="true" data-testid="pageModelNote" />
    </PopupInputLine>

    <!-- Tags -->
    <PopupInputLine title="Tags">
      <q-select
        input-class="q-ma-none q-pa-none"
        borderless
        filled
        dense
        options-dense
        v-model="pageModel.tagsInfo"
        use-input
        use-chips
        multiple
        hide-dropdown-icon
        input-debounce="0"
        new-value-mode="add-unique"
        @update:model-value="(val) => updatedTags(val)">
        <template v-slot:selected>
          <q-chip
            v-for="info in pageModel.tagsInfo"
            @remove="removeTag(info)"
            dense
            square
            removable
            :color="info.type == 'manual' ? 'white' : 'grey-2'"
            text-color="primary"
            class="q-my-none q-ml-xs q-mr-none">
            {{ info.label }}
          </q-chip>
        </template>
      </q-select>
    </PopupInputLine>

    <!-- collections chips -->
    <PopupInputLine :title="collectionsTitle()" v-if="showCollectionChips()">
      <q-chip
        v-for="chip in collectionChips.filter((c: object) => c['tabsetId' as keyof object] !== currentTabset?.id)"
        class="cursor-pointer q-ml-xs q-mt-sm"
        outline
        dense
        color="grey-8"
        size="12px"
        @click="switchTabset(chip['tabsetId' as keyof object])"
        clickable>
        {{ chip['label' as keyof object] }}
      </q-chip>
    </PopupInputLine>

    <PopupInputLine title="Snapshots" v-if="mds.length > 0">
      <div class="row" v-for="snapshot in mds">
        <div class="col-10 text-caption q-mt-sm text-grey-8">
          {{ date.formatDate(snapshot.created, 'DD.MM.YYYY HH:MM') }}
        </div>
        <div class="col text-right q-mt-sm">
          <q-icon name="o_open_in_new" color="grey-8" class="q-mr-md cursor-pointer" @click="openMHtml(snapshot.id)" />
          <q-icon name="o_delete" color="red" class="cursor-pointer" @click="deleteMHtml(snapshot.id)" />
        </div>
      </div>
    </PopupInputLine>

    <!-- Actions -->
    <PopupInputLine title="Actions" class="q-mt-xs" v-if="tab">
      <q-btn
        v-if="useFeaturesStore().hasFeature(FeatureIdent.READING_MODE)"
        icon="o_article"
        size="sm"
        outline
        @click="openAsArticle()"
        color="grey-7"
        class="cursor-pointer q-mt-xs">
        <q-tooltip class="tooltip-small" :delay="500">Open in Reading Mode</q-tooltip>
      </q-btn>
      <q-btn
        v-if="useFeaturesStore().hasFeature(FeatureIdent.SAVE_MHTML)"
        icon="o_save"
        size="sm"
        outline
        @click="saveSnapshot()"
        color="grey-7"
        class="cursor-pointer q-mt-xs q-ml-sm">
        <q-tooltip class="tooltip-small" :delay="500">Save a snapshot of this page</q-tooltip>
        <!--        <q-badge v-if="snapshotsSize > 0" floating color="warning" size="xs" text-color="primary"-->
        <!--          >{{ snapshotsSize }}-->
        <!--        </q-badge>-->
      </q-btn>
    </PopupInputLine>

    <!-- buttons -->
    <div class="row q-my-md darkInDarkMode brightInBrightMode" style="border: 0 solid blue">
      <div class="col-2 q-ml-xs q-mt-sm text-right text-caption text-grey-8" style="border: 0 solid red"></div>
      <div class="col q-mx-md text-right" style="border: 0 solid red">
        <q-btn
          v-if="!tab || tab.url !== pageModel.url"
          style="width: 100px"
          dense
          label="Add"
          color="primary"
          unelevated
          size="15px"
          @click="addTab"
          class="cursor-pointer q-px-md">
        </q-btn>
        <q-btn
          v-else
          style="width: 100px"
          outline
          dense
          label="Delete"
          color="negative"
          unelevated
          size="15px"
          @click="deleteTab"
          class="cursor-pointer q-px-md">
        </q-btn>
      </div>
    </div>

    <template v-if="useSettingsStore().has('DEBUG_MODE')">
      <div class="row q-pa-none q-ma-none fit">
        <div
          class="col-12 q-pa-none q-mx-md q-mt-md q-mb-none text-caption ellipsis-2-lines"
          style="font-size: smaller">
          {{ browserTab?.url }}
        </div>
        <div class="col-12 q-pa-none q-mx-md q-my-none text-caption" style="font-size: smaller">
          {{ useContentStore().getCurrentTabContent?.length }}
        </div>
        <div class="col-12 q-pa-none q-mx-md q-my-none text-caption" style="font-size: smaller">
          {{ useContentStore().currentTabFavIcon }}<br />
          <!-- {{ text }}<br />-->
          <!--          <hr />-->
          <!--          {{ browserTab }}<br />-->
        </div>
      </div>
    </template>

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode q-ma-none q-ml-md">
      <PopupToolbar title="Tabsets" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { date, LocalStorage, uid } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useContentStore } from 'src/content/stores/contentStore'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import { TagInfo } from 'src/core/models/TagInfo'
import AutogrowInput from 'src/core/pages/popup/helper/AutogrowInput.vue'
import PopupCollectionSelector from 'src/core/pages/popup/PopupCollectionSelector.vue'
import PopupFolderSelector from 'src/core/pages/popup/PopupFolderSelector.vue'
import PopupInputLine from 'src/core/pages/popup/PopupInputLine.vue'
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import ContentUtils from 'src/core/utils/ContentUtils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { SaveMHtmlCommand } from 'src/snapshots/commands/SaveMHtmlCommand'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { UiDensity, useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, provide, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const thumbnail = ref<string | undefined>(useTabsStore2().currentChromeTab?.favIconUrl)
const currentTabset = ref<Tabset | undefined>(undefined)
const browserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const paddingTop = ref('padding-top: 40px')
const uiDensity = ref<UiDensity>(useUiStore().uiDensity)
const alreadyInTabset = ref<boolean>(false)
const containedInTsCount = ref(0)
const text = ref<string | undefined>(undefined)
// const tags = ref<string[]>([])
const collectionChips = ref<object[]>([])

const infoModes = ['saved', 'updated', 'count', 'lastActive']
const infoMode = ref<string>(infoModes[0]!)

provide('ui.density', uiDensity)

const pageModel = reactive<{
  url: string
  note: string
  tagsInfo: TagInfo[]
  title: string | undefined
  description: string | undefined
}>({
  url: '',
  note: '',
  tagsInfo: [],
  title: undefined,
  description: undefined,
})

let initialNote = ''

const language = ref<string | undefined>(undefined)
const infoLabel = ref('')
const mds = ref<BlobMetadata[]>([])
const pageCaptureInProgress = ref(false)

onMounted(() => {
  Analytics.firePageViewEvent('PopupPage', document.location.href)
  //switch early
  if (!LocalStorage.getItem('ui.hideWelcomePage')) {
    useRouter().push('/popup/welcome')
  }
})

watchEffect(() => {
  const loading = useUiStore().pageCaptureLoading
  console.log('loading', loading)
  pageCaptureInProgress.value = loading
  if (!loading) {
    console.log('hier')
  }
})

watchEffect(() => {
  if (!tab.value) {
    return
  }
  console.log('mode set to ', infoMode.value)
  switch (infoMode.value) {
    case 'saved':
      infoLabel.value = 'Saved ' + date.formatDate(tab.value.created, 'DD.MM.YY HH:mm')
      break
    case 'updated':
      infoLabel.value = 'Updated ' + date.formatDate(tab.value.updated, 'DD.MM.YY HH:mm')
      break
    case 'count':
      infoLabel.value = `Opened ${tab.value.activatedCount}x`
      break
    case 'lastActive':
      infoLabel.value = 'Updated ' + date.formatDate(tab.value.lastActive, 'DD.MM.YY HH:mm')
      break
  }
})

watchEffect(() => {
  if (tab.value && pageModel.note !== initialNote) {
    infoLabel.value = 'updating...'
    setTimeout(() => {
      if (currentTabset.value) {
        tab.value!.note = pageModel.note
        tab.value!.updated = new Date().getTime()
        useTabsetsStore().saveTabset(currentTabset.value)
        infoLabel.value = 'Updated ' + date.formatDate(tab.value!.updated, 'DD.MM.YY HH:mm')
      }
    }, 1000)
  }
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  browserTab.value = useTabsStore2().currentChromeTab
  if (browserTab.value) {
    //url.value = browserTab.value.url
    pageModel.url = browserTab.value.url || 'https://'
    pageModel.title = browserTab.value.title
    alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(browserTab.value.url)
    const tabsets = useTabsetService().tabsetsFor(browserTab.value.url!)
    containedInTsCount.value = tabsets.length
    if (currentTabset.value && browserTab.value && browserTab.value.url) {
      tab.value = currentTabset.value.tabs.find((t: Tab) => t.url === browserTab.value!.url)
      if (tab.value) {
        infoLabel.value = 'Saved ' + date.formatDate(tab.value.created, 'DD.MM.YY HH:mm')
        initialNote = tab.value.note
        pageModel.note = tab.value.note
        useSnapshotsStore()
          .metadataFor(tab.value.id)
          .then((res) => {
            mds.value = res
            mds.value = mds.value.sort((a: BlobMetadata, b: BlobMetadata) => b.created - a.created)
            console.log('got', mds.value)
          })
      }
      const url = browserTab.value.url
      if (url) {
        collectionChips.value = useTabsetService()
          .tabsetsFor(url)
          .map((ts: string) => {
            return {
              label: useTabsetService().nameForTabsetId(ts),
              tabsetId: ts,
              encodedUrl: btoa(url || ''),
            }
          })
        //console.log('===>', collectionChips.value)
      }
    } else {
      //var t = tabsets.map((ts: Tabset) => ts.tabs)
    }
  }
})

watchEffect(() => {
  const article = useContentStore().currentTabArticle
  if (article) {
    // console.log('article', article)
    const articleContent = ContentUtils.html2text(article['content' as keyof object])
    //console.log('articleContent', articleContent)
    text.value = articleContent

    if (useFeaturesStore().hasFeature(FeatureIdent.AI) && text.value && text.value.trim().length > 10) {
      //console.log('::::', text.value)
      console.log('::::', pageModel.description)
      const data = {
        text: pageModel.description,
        candidates: ['news', 'shopping', 'sport'],
      }

      chrome.runtime.sendMessage(
        {
          name: 'zero-shot-classification',
          data: data,
        },
        (callback: any) => {
          console.log('got callback!!', callback)
          if (chrome.runtime.lastError) {
            /* ignore */
          }
          if (callback) {
            const labels: string[] = callback['labels'] as string[]
            const scores: number[] = callback['scores'] as number[]
            console.log('adding tags for ', labels, scores)
            labels.forEach((label: string, index: number) => {
              if (scores[index]! >= 0.5) {
                // pageModel.tags.push(label)
                pageModel.tagsInfo.push({ label: label, type: 'classification', score: scores[index] || 0 })
              }
            })
          }
        },
      )
    }
  }
})

watchEffect(() => {
  const metas = useContentStore().currentTabMetas
  //console.log('metas', metas)
  if (metas['description' as keyof object]) {
    pageModel.description = (metas['description' as keyof object] as string | undefined) || ''
    if (
      useFeaturesStore().hasFeature(FeatureIdent.AI) &&
      pageModel.description &&
      pageModel.description.trim().length > 10
    ) {
      console.log(':::', pageModel.description)
      const data = {
        text: 'ich bin ein Text',
        candidates: ['news', 'shopping'],
      }

      chrome.runtime.sendMessage(
        {
          name: 'zero-shot-classification',
          data: data,
        },
        (callback: any) => {
          console.log('got callback!!', callback)
          if (chrome.runtime.lastError) {
            /* ignore */
          }
          if (callback) {
            const labels: string[] = callback['labels'] as string[]
            const scores: number[] = callback['scores'] as number[]
            console.log('adding tags for ', labels, scores)
            if (labels && labels.length > 0) {
              labels.forEach((label: string, index: number) => {
                if (scores[index]! >= 0.5) {
                  pageModel.tagsInfo.push({ label: label, type: 'classification', score: scores[index] || 0 })
                }
              })
            }
          }
        },
      )

      try {
        // @ts-expect-error xxx
        LanguageDetector.create().then((detector: any) => {
          detector.detect(pageModel.description).then((results: any[]) => {
            // for (const result of results) {
            //   console.log(result.detectedLanguage, result.confidence)
            // }
            if (results.length > 0) {
              language.value = results[0].detectedLanguage
              // pageModel.aiTags.push(results[0].detectedLanguage)
              pageModel.tagsInfo.push({
                label: results[0].detectedLanguage,
                type: 'langDetection',
                score: results[0].confidence || 0,
              })
            }
          })
        })
      } catch (e) {
        console.log('error with language detection')
      }
    }
  }
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  tabsetsLastUpdate.value = useTabsetsStore().lastUpdate
})

watchEffect(() => {
  if (tab.value) {
    useThumbnailsService()
      .getThumbnailFor(tab.value.id, useAuthStore().user.uid)
      .then((data) => {
        if (data) {
          //console.log('setting thumbnail to ', data)
          thumbnail.value = data
        } else {
          //thumbnail.value = ''
        }
      })
  }
})

const tabsetChanged = () => (currentTabset.value = useTabsetsStore().getCurrentTabset)

const updatedTags = (val: (TagInfo | string)[]) => {
  console.log('updating tag', val)
  pageModel.tagsInfo = val.map((v: any) => {
    console.log('type', typeof v)
    if (typeof v == 'string') {
      console.log('hier', v)
      return { label: v, type: 'manual', score: 1 }
    }
    return v
  })
  console.log('updating tag2', pageModel.tagsInfo)
}

const openAsArticle = () => {
  if (tab.value) {
    useNavigationService().browserTabFor(
      chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${tab.value.id}`),
    )
  } else {
    useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode`))
  }
}
const addTab = () => {
  console.log('hier', browserTab.value)
  // validation?
  if (browserTab.value) {
    const newTab: Tab = new Tab(uid(), browserTab.value)
    newTab.url = pageModel.url
    newTab.note = pageModel.note
    newTab.description = pageModel.description || ''
    newTab.tagsInfo = pageModel.tagsInfo
    useCommandExecutor()
      .executeFromUi(new AddTabToTabsetCommand(newTab, currentTabset.value)) //, props.folder?.id))
      .then(() => {
        //BexFunctions.broadcast($q, 'tab-added', { url: newTab.url })
      })
  }
}

const deleteTab = () => {
  if (tab.value && currentTabset.value) {
    useCommandExecutor().executeFromUi(new DeleteTabCommand(tab.value, currentTabset.value))
  }
}

const interateThroughInfo = () => {
  const currentIndex = infoModes.indexOf(infoMode.value)
  const nextIndex = (currentIndex + 1) % infoModes.length
  infoMode.value = infoModes[nextIndex]!
}

const currentTabsetHasFolders = (): boolean =>
  (currentTabset.value && currentTabset.value.folders && currentTabset.value.folders.length > 0) || false

const showFolders = () =>
  useFeaturesStore().hasFeature(FeatureIdent.FOLDER) && currentTabsetHasFolders() && currentTabset

const collectionsTitle = () => {
  if (collectionChips.value.find((c: object) => c['tabsetId' as keyof object] === currentTabset.value?.id)) {
    return 'also in'
  }
  return 'already in'
}
const showCollectionChips = () =>
  collectionChips.value.filter((c: object) => c['tabsetId' as keyof object] !== currentTabset.value?.id).length > 0

const switchTabset = (tsId: string) => {
  console.log('tsId', tsId)
  useTabsetsStore().selectCurrentTabset(tsId)
  //tabsetChanged()
}

const saveSnapshot = () => {
  console.log('hier', tab.value)
  if (tab.value && tab.value.url) {
    useCommandExecutor().executeFromUi(new SaveMHtmlCommand(tab.value.id, tab.value.url))
  }
}
const openMHtml = (id: string) => window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/mhtml/${id}`))
const deleteMHtml = (id: string) => useSnapshotsService().deleteSnapshot(id)
const removeTag = (toDelete: TagInfo) =>
  (pageModel.tagsInfo = pageModel.tagsInfo.filter((i: TagInfo) => i.label !== toDelete.label))
</script>

<!--<style lang="scss" src="src/pages/css/sidePanelPage2.scss" />-->
