<template>
  <!-- PopupPage -->
  <q-page class="darkInDarkMode brightInBrightMode" :style="paddingTop" style="min-width: 400px; max-height: 700px">
    <offline-info class="q-mt-lg" />

    <div class="q-pa-sm q-mx-md q-mt-none boxed" v-if="[...useTabsetsStore().tabsets.keys()].length > 0">
      <PopupInputLine title="Collection">
        <PopupCollectionSelector
          @tabset-changed="tabsetChanged()"
          :show-tabs-count="!currentTabsetHasFolders()"
          :url="url" />
      </PopupInputLine>

      <PopupInputLine title="Folder" v-if="showFolders()">
        <PopupFolderSelector
          @tabset-changed="tabsetChanged()"
          :show-tabs-count="currentTabsetHasFolders()"
          :currentTabset="currentTabset!" />
      </PopupInputLine>
    </div>

    <!-- Icon, title and description -->
    <div class="row q-pa-sm q-mx-md q-mt-xs boxed">
      <div class="col-2 q-ma-sm">
        <q-img v-if="thumbnail" :src="thumbnail" no-native-menu />
        <q-img v-else :src="browserTab?.favIconUrl" no-native-menu />
      </div>
      <div class="col q-mx-sm">
        <div class="column">
          <div class="col">
            <AutogrowInput
              v-model="title"
              :input-class="'text-bold text-normal'"
              :class="'ellipsis'"
              :filled="false"
              data-testid="pageModelTitle" />
          </div>
          <div
            style="border: 0 solid green"
            v-if="!editDescription"
            class="col ellipsis-3-lines text-body2"
            :class="description ? '' : 'text-grey-8'"
            @click="toggleEditDescription()">
            {{ description ? description : 'no description provided' }}
          </div>
          <div v-else style="border: 0 solid red">
            <AutogrowInput
              @blur="toggleEditDescription()"
              ref="descriptionRef"
              v-model="description"
              :class="'ellipsis-3-lines'"
              :filled="false"
              :active="true" />
          </div>
        </div>
      </div>
    </div>

    <!-- info label: created, updated, ... -->
    <div class="row q-my-xs" v-if="tab && tab.url == url">
      <div class="col text-right text-caption text-grey-8 q-mx-md cursor-pointer" @click="interateThroughInfo">
        {{ infoLabel }}
      </div>
    </div>

    <div class="q-pa-sm q-mx-md q-mt-xs boxed">
      <!-- URL -->
      <PopupInputLine title="URL" class="q-mt-md">
        <AutogrowInput v-model="url" :class="'ellipsis'" :filled="true" data-testid="pageModelUrl" />
      </PopupInputLine>

      <!-- Note -->
      <PopupInputLine title="Note">
        <AutogrowInput v-model="note" :class="'ellipsis'" :filled="true" data-testid="pageModelNote" />
      </PopupInputLine>

      <PopupInputLine title="Annotations" v-if="tab && tab.annotations.length > 0">
        <div class="ellipsis text-caption" v-for="a in tab.annotations">
          {{ a.text }}
        </div>
      </PopupInputLine>

      <!-- Tags -->
      <PopupInputLine
        v-if="useFeaturesStore().hasFeature(FeatureIdent.TAGS)"
        :loading="loading"
        :title="tagsInfo.length > 1 ? tagsInfo.length + ' Tags' : 'Tags'">
        <q-select
          input-class="q-ma-none q-pa-none"
          borderless
          filled
          dense
          options-dense
          v-model="tagsInfo"
          use-input
          use-chips
          multiple
          hide-dropdown-icon
          input-debounce="0"
          new-value-mode="add-unique"
          @update:model-value="(val) => updatedTags(val)">
          <template v-slot:selected>
            <q-chip
              v-for="info in tagsInfo.filter((t: TagInfo) =>
                useSettingsStore().has('DEBUG_MODE') ? true : t.type == 'manual',
              )"
              @remove="removeTag(info)"
              dense
              square
              outline
              removable
              :color="
                info.type == 'manual'
                  ? 'primary'
                  : info.type == 'url'
                    ? 'orange-8'
                    : info.type == 'classification'
                      ? 'green-8'
                      : 'grey-8'
              "
              text-color="primary"
              class="q-my-xs q-ml-xs q-mr-none">
              {{ info.label }}
              <q-tooltip class="tooltip-small" :delay="500">
                {{ tooltipFor(info) }}
              </q-tooltip>
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
            <q-icon
              name="o_open_in_new"
              color="grey-8"
              class="q-mr-md cursor-pointer"
              @click="openMHtml(snapshot.id)" />
            <q-icon name="o_delete" color="red" class="cursor-pointer" @click="deleteMHtml(snapshot.id)" />
          </div>
        </div>
      </PopupInputLine>
    </div>

    <!-- Actions -->
    <PopupInputLine title="Actions" class="q-mt-xs" v-if="tab">
      <PopupActionButton
        v-if="useFeaturesStore().hasFeature(FeatureIdent.READING_MODE)"
        icon="o_article"
        @button-clicked="openAsArticle()">
        <q-tooltip class="tooltip-small" :delay="500">Open in Reading Mode</q-tooltip>
      </PopupActionButton>
      <q-btn
        v-if="useFeaturesStore().hasFeature(FeatureIdent.SAVE_MHTML)"
        icon="o_save"
        size="sm"
        outline
        @click="saveSnapshot()"
        color="grey-7"
        class="cursor-pointer q-mt-xs q-ml-sm">
        <q-tooltip class="tooltip-small" :delay="500">Save a snapshot of this page</q-tooltip>
      </q-btn>
    </PopupInputLine>

    <!-- buttons -->
    <div class="row q-my-md darkInDarkMode brightInBrightMode" style="border: 0 solid blue">
      <div class="col-2 q-ml-xs q-mt-sm text-right text-caption text-grey-8" style="border: 0 solid red"></div>
      <div class="col q-mx-md text-right" style="border: 0 solid red">
        <q-btn
          v-if="!tab || tab.url !== url"
          style="width: 100px"
          dense
          label="Add"
          color="primary"
          unelevated
          size="15px"
          @click="addTab"
          data-testid="addNewTabBtn"
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

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode q-ma-none q-ml-md">
      <PopupToolbar :title="toolbarTitle()" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { useFocus } from '@vueuse/core' // the page model
import { TAGS_CATEGORIES } from 'boot/constants'
import { date, LocalStorage, uid } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useContentStore } from 'src/content/stores/contentStore'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { CategoryInfo, TagInfo } from 'src/core/models/TagInfo'
import AutogrowInput from 'src/core/pages/popup/helper/AutogrowInput.vue'
import PopupActionButton from 'src/core/pages/popup/helper/PopupActionButton.vue'
import PopupCollectionSelector from 'src/core/pages/popup/PopupCollectionSelector.vue'
import PopupFolderSelector from 'src/core/pages/popup/PopupFolderSelector.vue'
import PopupInputLine from 'src/core/pages/popup/PopupInputLine.vue'
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import ContentUtils from 'src/core/utils/ContentUtils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { SaveMHtmlCommand } from 'src/snapshots/commands/SaveMHtmlCommand'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { IgnoreTagCommand } from 'src/tabsets/commands/IgnoreTagCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useTagsService } from 'src/tags/TagsService'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { UiDensity, useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, provide, ref, useTemplateRef, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// the page model
const url = ref<string>('')
const title = ref<string>('')
const description = ref<string>('')
const note = ref<string>('')
const tagsInfo = ref<TagInfo[]>([])

const thumbnail = ref<string | undefined>(useTabsStore2().currentChromeTab?.favIconUrl)
const currentTabset = ref<Tabset | undefined>(undefined)
const browserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const paddingTop = ref('padding-top: 50px')
const uiDensity = ref<UiDensity>(useUiStore().uiDensity)
const alreadyInTabset = ref<boolean>(false)
const containedInTsCount = ref(0)
const text = ref<string | undefined>(undefined)
const collectionChips = ref<object[]>([])

const editDescription = ref(false)
const descriptionRef = useTemplateRef<HTMLElement>('descriptionRef')
const { focused: editDescriptionFocus } = useFocus(descriptionRef)

const infoModes = ['saved', 'updated', 'count', 'lastActive']
const infoMode = ref<string>(infoModes[0]!)

const loading = ref<boolean>(useUiStore().aiLoading)

const { handleSuccess } = useNotificationHandler()
provide('ui.density', uiDensity)

let initialNote = ''
let initialDesc = ''

const infoLabel = ref('')
const mds = ref<BlobMetadata[]>([])
const pageCaptureInProgress = ref(false)

function pushTagsInfo() {
  return (tag: TagInfo) => {
    tagsInfo.value.push(tag)
    tagsInfo.value = useTagsService().deduplicateTags(tagsInfo.value)
  }
}

function langFromHostname(url: string | undefined): string {
  if (url) {
    try {
      const hostname = new URL(url).hostname
      return hostname.split('.')[hostname.split('.').length - 1] || 'en'
    } catch (e) {
      return 'en'
    }
  }
  return 'en'
}

function updateOnlineStatus(e: any) {
  const { type } = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  window.addEventListener('offline', (e) => updateOnlineStatus(e))
  window.addEventListener('online', (e) => updateOnlineStatus(e))

  Analytics.firePageViewEvent('PopupPage', document.location.href)
  //switch early
  if (!LocalStorage.getItem('ui.hideWelcomePage')) {
    useRouter().push('/popup/welcome')
  }

  if (tab.value) {
    return
  }
  // keyword tags
  const metas = useContentStore().getCurrentTabMetas
  if (metas && metas['keywords' as keyof object]) {
    useTagsService()
      .tagsFromKeywords(metas['keywords' as keyof object] as string)
      .forEach(pushTagsInfo())
  }

  // hierarchy tags
  if (currentTabset.value) {
    useTagsService().tagsFromHierarchy(currentTabset.value).forEach(pushTagsInfo())
  }

  // url tags
  if (browserTab.value?.url) {
    useTagsService().tagsFromUrl(browserTab.value.url, 'de').forEach(pushTagsInfo())
  }
})

watchEffect(() => {
  loading.value = useUiStore().aiLoading
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
  if (tab.value && (note.value !== initialNote || description.value !== initialDesc)) {
    infoLabel.value = 'updating...'
    setTimeout(() => {
      if (currentTabset.value) {
        tab.value!.note = note.value
        tab.value!.description = description.value
        tab.value!.updated = new Date().getTime()
        useTabsetsStore().saveTabset(currentTabset.value)
        infoLabel.value = 'Updated ' + date.formatDate(tab.value!.updated, 'DD.MM.YY HH:mm')
      }
    }, 1000)
  }
})

function getSnapshots() {
  if (!tab.value) {
    return
  }
  useSnapshotsStore()
    .metadataFor(tab.value.id)
    .then((res) => {
      mds.value = res
      mds.value = mds.value.sort((a: BlobMetadata, b: BlobMetadata) => b.created - a.created)
      console.log('got', mds.value)
    })
}

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  browserTab.value = useTabsStore2().currentChromeTab
  if (browserTab.value) {
    //url.value = browserTab.value.url
    url.value = browserTab.value.url || 'https://'
    title.value = browserTab.value.title || ''
    alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(browserTab.value.url)
    const tabsets = useTabsetService().tabsetsFor(browserTab.value.url!)
    containedInTsCount.value = tabsets.length
    if (currentTabset.value && browserTab.value && browserTab.value.url) {
      tab.value = currentTabset.value.tabs.find((t: Tab) => t.url === browserTab.value!.url)
      if (tab.value) {
        infoLabel.value = 'Saved ' + date.formatDate(tab.value.created, 'DD.MM.YY HH:mm')
        initialNote = tab.value.note
        note.value = tab.value.note
        initialDesc = tab.value.description
        description.value = tab.value.description
        console.log('setting tagsInfo')
        tagsInfo.value = tab.value.tagsInfo || []
        getSnapshots()
      }
      const browserUrl = browserTab.value.url
      if (browserUrl) {
        collectionChips.value = useTabsetService()
          .tabsetsFor(browserUrl)
          .map((ts: string) => {
            return {
              label: useTabsetService().nameForTabsetId(ts),
              tabsetId: ts,
              encodedUrl: btoa(browserUrl || ''),
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

    const categories: CategoryInfo[] = LocalStorage.getItem(TAGS_CATEGORIES) || []

    //console.log('::::', text.value.length)
    console.log('::::', description.value)

    if (
      useFeaturesStore().hasFeature(FeatureIdent.AI) &&
      !tab.value &&
      categories.length > 0 &&
      text.value &&
      text.value.trim().length > 10
    ) {
      useUiStore().aiLoading = true
      console.log('::::', text.value.length)
      //console.log('::::', pageModel.description)
      const data = {
        text: description.value,
        candidates: categories.map((c: CategoryInfo) => c.label),
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

            useTagsService()
              .tagsFromClassification(categories, labels, scores, 0.3 / Math.log(labels.length))
              .forEach(pushTagsInfo())
            useUiStore().aiLoading = false
          }
          useUiStore().aiLoading = false
        },
      )
    }
  }
})

watchEffect(() => {
  const metas = useContentStore().currentTabMetas
  //console.log('metas', metas)
  if (metas['description' as keyof object]) {
    description.value = (metas['description' as keyof object] as string | undefined) || ''
    if (useFeaturesStore().hasFeature(FeatureIdent.AI) && description.value && description.value.trim().length > 10) {
      try {
        // @ts-expect-error xxx
        LanguageDetector.create().then((detector: any) => {
          detector.detect(text.value).then((results: any[]) => {
            if (results.length > 0) {
              var language = results[0].detectedLanguage
              var confidence = results[0].confidence || 0
              useTagsService().tagsFromLangDetection(language, confidence).forEach(pushTagsInfo())
              useTagsService()
                .tagsFromLanguageModel(description.value, language, 'languageModel')
                .forEach(pushTagsInfo())
            }
          })
        })
      } catch (e) {
        useTagsService()
          .tagsFromLanguageModel(description.value, langFromHostname(browserTab.value?.url), 'languageModel')
          .forEach(pushTagsInfo())
        console.log('error with language detection')
      }
    } else if (description.value && description.value.trim().length > 10) {
      useTagsService()
        .tagsFromLanguageModel(description.value, langFromHostname(browserTab.value?.url), 'languageModel')
        .forEach(pushTagsInfo())
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
      .catch((e: any) => {
        console.debug('error', e)
      })
  }
})

const tabsetChanged = () => (currentTabset.value = useTabsetsStore().getCurrentTabset)

const updatedTags = (val: (TagInfo | string)[]) => {
  console.log('updating tag', val)
  tagsInfo.value = val.map((v: any) => {
    console.log('type', typeof v)
    if (typeof v == 'string') {
      console.log('hier', v)
      return { label: v, type: 'manual', score: 1 }
    }
    return v
  })
  console.log('updating tag2', tagsInfo.value)
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
    newTab.url = url.value
    newTab.note = note.value
    newTab.description = description.value || ''
    newTab.tagsInfo = tagsInfo.value
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
  if (tab.value && tab.value.url) {
    useCommandExecutor()
      .executeFromUi(new SaveMHtmlCommand(tab.value.id, tab.value.url))
      .then(() => {
        getSnapshots()
      })
  }
}

const openMHtml = (id: string) => window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/mhtml/${id}`))
const deleteMHtml = (id: string) =>
  useSnapshotsService()
    .deleteSnapshot(id)
    .then(() => getSnapshots())

const removeTag = (toDelete: TagInfo) => {
  tagsInfo.value = tagsInfo.value.filter((i: TagInfo) => i.label !== toDelete.label)
  let result: ExecutionResult<any> | undefined = undefined
  if (toDelete.type === 'keyword') {
    result = new ExecutionResult(
      'res',
      'Tag was deleted',
      new Map([
        // ['Close', new NoOpCommand()],
        ['Always Ignore in future', new IgnoreTagCommand(toDelete.label)],
      ]),
    )
  } else if (toDelete.type === 'classification') {
    const cats: CategoryInfo[] = LocalStorage.getItem(TAGS_CATEGORIES) || []
    const category = cats.find((c: CategoryInfo) => c.label === toDelete.label)
    if (category) {
      category.weight = category.weight / 1.1
      LocalStorage.setItem(TAGS_CATEGORIES, cats)
    }
  }

  if (result) {
    handleSuccess(result, NotificationType.USER_CHOICE)
  }
}

const tooltipFor = (info: TagInfo): string => {
  const debug = useSettingsStore().has('DEBUG_MODE')
  let tooltip = ''
  switch (info.type) {
    case 'keyword':
      tooltip = "automatic tag derived from website's keywords"
      break
    case 'url':
      tooltip = 'automatic tag derived from URL'
      break
    case 'classification':
      tooltip = 'Classification, derived from site\s description using AI'
      if (debug) {
        tooltip += ' (score ' + Math.round(info.score * 1000) / 10 + '%)'
      }
      break
    case 'langDetection':
      tooltip = "Language, derived from site's description using AI"
      if (debug) {
        tooltip += ' (score ' + Math.round(info.score * 1000) / 10 + '%)'
      }
      break
    case 'languageModel':
      tooltip = "LanguageModel, derived from site's description using static analysis"
      break
    default:
      tooltip = info.type
  }
  return tooltip
}

const toggleEditDescription = () => {
  editDescription.value = !editDescription.value
  setTimeout(() => {
    editDescriptionFocus.value = editDescription.value
  }, 600)
}

const toolbarTitle = () => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const space = useSpacesStore().space
    if (space) {
      return 'Tabsets: ' + space.label
    }
  }
  return 'Tabsets'
}
</script>

<!--<style lang="scss" src="src/pages/css/sidePanelPage2.scss" />-->
