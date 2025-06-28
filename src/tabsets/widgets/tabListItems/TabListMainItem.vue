<template>
  <!-- === name or title === -->
  <q-item-label @click.stop="gotoTab()">
    <div class="row">
      <div class="col-11 q-pr-none q-mr-none cursor-pointer ellipsis fit">
        <span v-if="props.tab?.extension === UrlExtension.NOTE" v-html="nameOrTitle(props.tab as Tab)" />
        <span v-else :class="TabService.isCurrentTab(props.tab) ? 'text-bold' : ''" @click.stop="handleNameClick">
          <q-icon
            v-if="props.tab?.favorite && props.tab?.favorite !== TabFavorite.NONE"
            :color="props.tab.favorite === TabFavorite.TABSET ? 'warning' : 'positive'"
            name="star"
            class="q-ma-mone">
            <q-tooltip class="tooltip_small">This tab is marked as favorite</q-tooltip>
          </q-icon>
          <!-- small icons in minimal view -->
          <template v-if="showDetailsForThreshold('MINIMAL')">
            <span v-if="(props.tab as Tab).placeholders">
              <q-icon
                name="sym_o_dynamic_feed"
                size="12px"
                style="position: relative; top: -4px"
                class="q-mr-xs"
                @click.stop="toggleShowWith('placeholder')">
                <q-tooltip class="tooltip-small">There are placeholders defined for this tab</q-tooltip>
              </q-icon>
            </span>
          </template>

          <Highlight :filter="props.filter" :text="nameOrTitle(props.tab as Tab) || ''">
            <template v-slot:popup>
              <q-popup-edit
                v-if="popupEdit"
                ref="popupRef"
                @hide="popupEdit = false"
                :model-value="nameOrTitle(props.tab as Tab)"
                @update:model-value="(val: string) => setCustomTitle(tab, val)"
                v-slot="scope"
                anchor="center middle">
                <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
              </q-popup-edit>
            </template>
          </Highlight>
        </span>
        <div v-if="props.header" class="text-caption">{{ props.header }}</div>
      </div>
    </div>
  </q-item-label>

  <!-- === created by === -->
  <q-item-label v-if="props.tab?.createdBy && props.tab.createdBy !== useAuthStore().user.email">
    <div class="text-body2 ellipsis" style="font-size: x-small">created by {{ props.tab.createdBy }}</div>
  </q-item-label>

  <!-- === description === -->
  <template v-if="showWithMinDetails('SOME')">
    <template v-if="props.tab?.extension !== UrlExtension.NOTE">
      <q-item-label
        class="ellipsis-2-lines text-body2 darkColors lightColors"
        :class="props.tab?.extension === UrlExtension.RSS ? 'ellipsis-3-lines' : 'ellipsis-2-lines'"
        @click.stop="gotoTab()">
        <Highlight :filter="props.filter" :text="props.tab.longDescription || props.tab.description || ''" />
      </q-item-label>
    </template>
    <template v-else>
      <q-item-label class="ellipsis-2-lines text-grey-8" @click.stop="gotoTab()">
        {{ props.tab.description }}
      </q-item-label>
    </template>
  </template>

  <!-- === RestTab === -->
  <div v-if="'params' in props.tab && 'api' in props.tab">
    <!--      <div v-for="p in props.tab.params">-->
    <!--        <q-input type="text" v-model="p['val' as keyof object]" :label="p['name' as keyof object]" />-->
    <!--      </div>-->
    <div>
      <q-btn label="Call API" type="submit" @click="callRestApi(props.tab)" size="xs" />
    </div>
  </div>

  <!-- === open search === -->
  <q-item-label v-if="showOpenSearchInput() && showWithMinDetails('SOME')">
    <div class="row q-ma-none q-pa-none q-my-xs">
      <div class="col-5 text-body2" style="font-size: smaller">
        <em>Direct Search:</em>
      </div>
      <div class="col-6">
        <form @submit.prevent="openSearch()">
          <input
            type="text"
            v-model="opensearchterm"
            autocomplete="on"
            :id="'opensearch_' + props.tab.id"
            :style="
              $q.dark.isActive ? 'background-color:#282828;color:white' : 'background-color:#F0F0F0;color-primary'
            "
            style="
              max-height: 20px;
              border: 0 solid white;
              border-bottom: 1px solid #c0c0c0;
              font-size: 12px;
              border-radius: 3px;
            " />
        </form>
      </div>
      <div class="col text-right">
        <q-btn icon="search" flat size="xs" @click="openSearch()" />
      </div>
    </div>
  </q-item-label>

  <!-- === RSS Links === -->
  <Transition name="fade" mode="out-in">
    <q-item-label v-if="showRssReferencesInfo()">
      <div class="row q-ma-none q-pa-none q-my-xs" v-for="ref in rssTabReferences">
        <div class="col-1 text-body2" style="font-size: smaller">
          <q-icon name="rss_feed" class="q-ma-none q-pa-none" color="warning" size="xs" />
        </div>
        <div class="col-7 ellipsis" style="font-size: smaller" @click="openRssDialog(ref)">
          {{ ref.title }}
          <q-tooltip v-if="ref.title.length > 20" class="tooltip-small">{{ ref.title }}</q-tooltip>
        </div>
        <div class="col text-right">
          <q-btn icon="o_open_in_new" flat size="xs" class="q-ma-none q-pa-none" @click="openRssLink(ref)" />
          <q-btn icon="o_close" flat size="xs" class="q-ma-none q-pa-none" @click="ignore(ref)" />
        </div>
      </div>
      <q-item-label v-if="rssTabReferences?.length > 2">
        <div class="row q-ma-none q-pa-none q-my-xs">
          <div class="col-1 text-body2" style="font-size: smaller"></div>
          <div class="col-7 cursor-pointer text-blue-8" style="font-size: smaller" @click="hideAll()">Hide all</div>
          <div class="col text-right"></div>
        </div>
      </q-item-label>
    </q-item-label>
  </Transition>

  <!-- === url(s) === -->
  <q-item-label
    style="width: 100%"
    v-if="props.tab?.url && (showWithMinDetails('SOME') || showPlaceholderList)"
    caption
    class="ellipsis-2-lines text-accent q-pt-xs"
    @mouseover="showButtonsProp = true"
    @mouseleave="showButtonsProp = false">
    <div class="row q-ma-none">
      <div class="col-12 q-pr-lg q-mb-xs cursor-pointer" @click="gotoTab()">
        <template v-if="props.tab.extension !== UrlExtension.RSS">
          <short-url
            @click.stop="gotoTab()"
            :url="props.tab.url"
            :hostname-only="!useUiStore().showFullUrls"
            :filter="props.filter || ''" />
          <q-icon
            v-if="props.tab.matcher && useFeaturesStore().hasFeature(FeatureIdent.ADVANCED_TAB_MANAGEMENT)"
            @click.stop="openTabAssignmentPage(props.tab)"
            name="o_settings">
            <q-tooltip class="tooltip">{{ matcherTooltip() }}</q-tooltip>
          </q-icon>
          <span v-if="showReadingMode()" class="cursor-pointer" @click.stop="showInReadingMode()">
            [Reading Mode]
          </span>
          <!-- <q-icon class="q-ml-xs" name="open_in_new"/>-->
          <ul v-if="placeholders.length > 0">
            <div v-for="placeholder in placeholders">
              <li>
                <short-url
                  @click.stop="
                    NavigationService.openOrCreateTab(
                      [placeholder['url' as keyof object]],
                      props.tab.matcher,
                      props.tab.groupName ? [props.tab.groupName] : [],
                    )
                  "
                  :label="placeholder['name' as keyof object]"
                  :url="placeholder['url' as keyof object]"
                  :hostname-only="true"
                  :filter="props.filter" />
              </li>
            </div>
          </ul>
        </template>
      </div>
    </div>
  </q-item-label>

  <!-- === group, last active & icons === -->
  <q-item-label
    style="width: 100%; margin-top: 0"
    v-if="props.tab?.url && showWithMinDetails('SOME')"
    caption
    class="ellipsis-2-lines text-accent"
    @mouseover="showButtonsProp = true"
    @mouseleave="showButtonsProp = false">
    <div class="row q-ma-none" @click="gotoTab()">
      <div class="col-12 q-pr-lg q-mt-none q-pt-none cursor-pointer">
        <div class="text-caption text-grey-5 ellipsis">
          <q-icon
            v-if="suggestion"
            @click.stop="showSuggestion()"
            name="o_notifications"
            class="q-mr-xs"
            size="xs"
            :color="suggestion.state === 'NOTIFICATION' ? 'negative' : 'accent'">
            <q-tooltip class="tooltip-small" v-if="suggestion.state === 'NOTIFICATION'"
              >There is a new notification for this tab
            </q-tooltip>
            <q-tooltip class="tooltip-small" v-else>There is a notification for this tab</q-tooltip>
          </q-icon>

          <q-icon
            v-if="pngs.length > 0"
            @click.stop="openImage()"
            size="xs"
            name="o_image"
            class="q-mr-xs"
            color="accent">
            <q-tooltip class="tooltip-small">There are snapshot images of this tab</q-tooltip>
          </q-icon>

          <q-icon
            v-if="(props.tab as Tab).placeholders"
            size="xs"
            name="published_with_changes"
            class="q-mr-xs"
            color="accent">
            <q-tooltip class="tooltip-small">This tab is created by substituting parts of its URL</q-tooltip>
          </q-icon>

          <q-btn
            v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0"
            @click.stop="toggleLists('comments')"
            class="q-mr-xs q-mt-xs"
            color="warning"
            dense
            round
            flat
            icon="o_chat">
            <q-tooltip class="tooltip-small"
              >This tab has {{ newCommentIds.length > 0 ? 'new' : '' }} comments
            </q-tooltip>
            <q-badge v-if="newCommentIds.length > 0" color="accent" rounded floating transparent>
              {{ newCommentIds.length }}
            </q-badge>
          </q-btn>

          <span
            v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 1"
            @click.stop="toggleLists('comments')"
            class="q-mr-sm q-ml-none"
            >({{ (props.tab as Tab).comments.length }})</span
          >

          <!--          <template v-if="groupName && useFeaturesStore().hasFeature(FeatureIdent.TAB_GROUPS)">-->
          <!--            Group <em>{{ groupName }}</em>-->
          <!--            <q-icon name="arrow_drop_down" class="q-mr-none" size="xs" color="text-grey-5" />-->
          <!--            <q-menu :offset="[0, 10]">-->
          <!--              <q-list dense>-->
          <!--                <q-item v-if="groups.size > 1" class="text-grey-5" style="font-size: smaller">-->
          <!--                  Change group to...-->
          <!--                </q-item>-->
          <!--                <q-item-->
          <!--                  clickable-->
          <!--                  v-for="group in groupsWithout(groupName)"-->
          <!--                  @click="switchGroup(group)"-->
          <!--                  style="font-size: smaller">-->
          <!--                  ...{{ group.title }}-->
          <!--                </q-item>-->
          <!--                <q-separator v-if="groups.size > 1" />-->
          <!--                <q-item clickable style="font-size: smaller" @click="unsetGroup()"> Unset Group</q-item>-->
          <!--                <q-separator />-->
          <!--                <q-item clickable style="font-size: smaller" @click="removeGroup(groupName)"> Remove Group</q-item>-->
          <!--              </q-list>-->
          <!--            </q-menu>-->
          <!--            - -->
          <!--          </template>-->

          <span>
            <TabListIconIndicatorsHook :tabId="props.tab.id" :tabUrl="props.tab.url" />
            <span v-if="props.tab.extension !== UrlExtension.RSS && showWithMinDetails('MAXIMAL')"
              >last active: {{ formatDate(props.tab.lastActive) }}</span
            >
            <span v-else-if="props.tab.extension === UrlExtension.RSS"
              >published: {{ formatDate(props.tab.created) }}</span
            >
          </span>
        </div>
      </div>
    </div>
  </q-item-label>

  <!-- === comments === -->
  <q-item-label v-if="showComments()" class="text-grey-5">
    <CommentChatMessages :comments="oldComments()" :tab="props.tab" :tabset-id="props.tabset?.id" />
    <h6 v-if="newComments().length > 0">new Message(s)</h6>
    <CommentChatMessages :comments="newComments()" :tab="props.tab" :tabset-id="props.tabset?.id" />

    <div class="row">
      <div class="col-6 text-right">&nbsp;</div>
      <div class="col text-right">
        <q-input dense filled v-model="sendComment" />
      </div>
      <div class="col-1">
        <q-btn icon="send" size="sm" @click="send()" />
      </div>
    </div>
  </q-item-label>

  <!-- === snippets === -->
  <q-item-label v-if="showWithMinDetails('SOME')" class="text-grey-10" text-subtitle1>
    <div
      v-if="TabService.isCurrentTab(props.tab)"
      v-for="s in props.tab.snippets"
      class="ellipsis-2-lines q-my-xs text-body2">
      {{ s.text }}
    </div>
  </q-item-label>

  <!-- === badges === -->
  <q-item-label v-if="props.showTabsets">
    <template v-for="badge in tsBadges">
      <q-chip clickable @click.stop="openTabset(badge)" class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">
        {{ badge['label' as keyof object] }}
      </q-chip>
    </template>
  </q-item-label>
</template>

<script setup lang="ts">
import { formatDistance } from 'date-fns'
import { QPopupEdit, uid, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import TabListIconIndicatorsHook from 'src/app/hooks/tabsets/TabListIconIndicatorsHook.vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import ShortUrl from 'src/core/utils/ShortUrl.vue'
import { useEventsServices } from 'src/events/services/EventsServices'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { RestTab } from 'src/rest/models/RestTab'
import NavigationService from 'src/services/NavigationService'
import TabService from 'src/services/TabService'
import { SavedBlob } from 'src/snapshots/models/SavedBlob'
import { useAuthStore } from 'src/stores/authStore'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { AddCommentCommand } from 'src/tabsets/commands/AddCommentCommand'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { OpenTabCommand } from 'src/tabsets/commands/OpenTabCommand'
import { UpdateTabNameCommand } from 'src/tabsets/commands/UpdateTabName'
import AddRssFeedDialog from 'src/tabsets/dialogues/actions/AddRssFeedDialog.vue'
import { PlaceholdersType } from 'src/tabsets/models/Placeholders'
import { Tab, TabComment, TabFavorite, UrlExtension } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import CommentChatMessages from 'src/tabsets/widgets/CommentChatMessages.vue'
import Highlight from 'src/tabsets/widgets/Highlight.vue'
import { ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'
import { nextTick, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { handleError } = useNotificationHandler()
const { useDblClickHandler, inBexMode } = useUtils()

const $q = useQuasar()
const router = useRouter()

const props = defineProps<{
  tabset: Tabset | undefined
  tab: Tab
  detailLevel: ListDetailLevel | undefined
  hideMenu?: boolean
  header?: string | undefined
  filter?: string | undefined
  showTabsets?: string
  showCommentsForMinimalDetails?: boolean | undefined
}>()

const showButtonsProp = ref<boolean>(false)
const tsBadges = ref<object[]>([])
const showCommentList = ref(false)
const showPlaceholderList = ref(false)
const placeholders = ref<Object[]>([])
const suggestion = ref<Suggestion | undefined>(undefined)
const pngs = ref<SavedBlob[]>([])
const opensearchterm = ref<string | undefined>(undefined)
const sendComment = ref<string>('')
const newCommentIds = ref<string[]>([])
const monitor = ref<MonitoredTab | undefined>(undefined)
const popupEdit = ref(false)
const popupRef = ref<any>(undefined)
const doShowDetails = ref(false)
const rssTabReferences = ref<TabReference[]>(
  props.tab?.tabReferences?.filter((r: TabReference) => r.type === TabReferenceType.RSS && r.status !== 'IGNORED'),
)

onMounted(() => {
  if (props.tabset?.id) {
    newCommentIds.value = useEventsServices().listNewComments(props.tabset.id, props.tab)
  }
  monitor.value =
    props.tabset &&
    props.tabset.monitoredTabs &&
    props.tabset.monitoredTabs.find((mt: MonitoredTab) => mt.tabId === props.tab.id)
})

watchEffect(() => {
  if (props.tab && props.tab.url) {
    // cnt.value = cnt.value + 1
    const url = props.tab.url
    const tabsetIds = useTabsetService().tabsetsFor(url)
    tsBadges.value = []
    tabsetIds.forEach((tsId: string) => {
      tsBadges.value.push({
        label: useTabsetService().nameForTabsetId(tsId),
        tabsetId: tsId,
        encodedUrl: btoa(url || ''),
      })
    })
  }
})

watchEffect(() => {
  // console.log('hierA')
  if (props.tab) {
    const t = props.tab
    //console.log("placeholders", t.placeholders)
    if (t.placeholders && t.placeholders.type === PlaceholdersType.URL_SUBSTITUTION) {
      const subs = t.placeholders.config
      Object.entries(subs).forEach((e) => {
        const name = e[0]
        const val = e[1]
        val.split(',').forEach((v: string) => {
          const substitution = v.trim()
          if (substitution.length > 0) {
            let useUrl = t.url || ''
            let useName = t.name || t.title || ''
            Object.entries(subs).forEach((e1) => {
              useUrl = useUrl.replaceAll('${' + name + '}', substitution)
              useName = useName.replaceAll('${' + name + '}', substitution)
            })
            placeholders.value.push({ url: useUrl, name: substitution })
          }
        })
      })
    }
  }
  //console.log("===>", placeholders.value)
})

const gotoTab = () => {
  if (props.tabset && props.tabset.monitoredTabs) {
    let found = false
    props.tabset.monitoredTabs.forEach((mt: MonitoredTab) => {
      if (mt.tabId === props.tab.id) {
        delete mt.changed
        found = true
      }
    })
    if (found) {
      useTabsetService().saveTabset(props.tabset)
    }
  }
  useCommandExecutor().executeFromUi(new OpenTabCommand(props.tab))
}

const showWithMinDetails = (level: ListDetailLevel) => /*doShowDetails.value ||*/ showDetailsForThreshold(level)

const showDetailsForThreshold = (level: ListDetailLevel) =>
  useUiStore().listDetailLevelGreaterEqual(level, props.tabset?.details, props.detailLevel)

const nameOrTitle = (tab: Tab) => (tab.name ? tab.name : tab.title)

const toggleLists = (ident: string) => {
  switch (ident) {
    case 'annotations':
      showCommentList.value = false
      break
    case 'comments':
      showCommentList.value = !showCommentList.value
      console.log('showCommentList set to', showCommentList.value)
      break
    case 'placeholder':
      showPlaceholderList.value = !showPlaceholderList.value
      break
    default:
      console.log('undefined ident for toggle lists', ident)
      break
  }
}

const toggleShowWith = (ident: string | undefined) => {
  doShowDetails.value = !doShowDetails.value
  if (ident) {
    toggleLists(ident)
  }
}

const setCustomTitle = (tab: Tab, newValue: string) =>
  useCommandExecutor().executeFromUi(new UpdateTabNameCommand(tab, newValue))

const handleNameClick = useDblClickHandler(
  () => gotoTab(),
  () => {
    popupEdit.value = true
    nextTick().then(() => {
      if (popupRef?.value) {
        popupRef.value.show()
      }
    })
  },
)

const callRestApi = (tab: Tab) => {
  const restTab = tab as RestTab
  console.log(`about to call ${restTab.api} with ${JSON.stringify(restTab.params)}`)
  useNavigationService().browserTabFor(chrome.runtime.getURL('www/index.html/#/mainpanel/restapi/' + restTab.id))
}

function hasReference(tab: Tab, refType: TabReferenceType) {
  const t: Tab = Object.assign(new Tab(tab.id, BrowserApi.createChromeTabObject('', '')), tab)
  return t.hasTabReference(refType)
}

const showOpenSearchInput = () => {
  return props.tab ? hasReference(props.tab, TabReferenceType.OPEN_SEARCH) : false
}

const openSearch = () => {
  console.log('openSearch clicked')
  try {
    const ref: object[] = props.tab.tabReferences.filter((ref) => ref.type === TabReferenceType.OPEN_SEARCH)[0]!.data
    const parser = new DOMParser()
    const xml = ref[0]!['xml' as keyof object]
    console.log('using xml', xml)
    const doc = parser.parseFromString(xml, 'application/xml')
    let urlTag = doc.getElementsByTagName('Url')[0]
    if (!urlTag) {
      urlTag = doc.getElementsByTagName('url')[0]
    }
    const templateURL: string = urlTag!.getAttribute('template') || ''
    useNavigationService().browserTabFor(templateURL.replace('{searchTerms}', opensearchterm.value || ''))
  } catch (err: any) {
    handleError(err, NotificationType.NOTIFY)
  }
}
const showReadingMode = () => {
  if (props.tab) {
    //console.log("xxx", props.tab.id)
    const t: Tab = Object.assign(new Tab(props.tab.id, BrowserApi.createChromeTabObject('', '')), props.tab)
    return useFeaturesStore().hasFeature(FeatureIdent.READING_MODE) && t.hasTabReference(TabReferenceType.READING_MODE)
  }
  return false
}

const showRssReferencesInfo = () => {
  // prettier-ignore
  return props.tab
    ? hasReference(props.tab, TabReferenceType.RSS) && TabService.isCurrentTab(props.tab)
    : false
}

const openRssDialog = (rss: TabReference) => {
  console.log('openRssDialog', rss)
  $q.dialog({
    component: AddRssFeedDialog,
    componentProps: { rssTabReference: rss },
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
  }).onOk(async (data: any) => {
    console.log('hier', data)
    const ts = useTabsetsStore().getCurrentTabset
    if (ts) {
      await useCommandExecutor().executeFromUi(
        new CreateFolderCommand(
          uid(),
          data['feedName' as keyof object].replace(STRIP_CHARS_IN_USER_INPUT, ''),
          [],
          ts.id,
          undefined,
          data['rssUrl' as keyof object],
          TabsetType.RSS_FOLDER,
        ),
      )
    }
  })
}

const openRssLink = (rss: TabReference) => {
  let useUrl = rss.href!
  if (useUrl.startsWith('/')) {
    try {
      const url = new URL(props.tab.url!)
      useUrl = url.protocol + '//' + url.hostname + rss.href!
    } catch (err) {}
  }
  //console.log('useUrl', useUrl)
  useNavigationService().browserTabFor(useUrl)
}

const ignore = (rss: TabReference) => {
  const tabReference = props.tab.tabReferences.find((tr: TabReference) => tr.id === rss.id)
  if (tabReference && props.tabset) {
    tabReference.status = 'IGNORED'
    useTabsetService().saveTabset(props.tabset)
  }
}

const hideAll = () => rssTabReferences.value.forEach((r: TabReference) => ignore(r))

const send = () => {
  if (sendComment.value.trim() !== '') {
    useCommandExecutor()
      .executeFromUi(new AddCommentCommand(props.tab.id, sendComment.value))
      .then(() => (sendComment.value = ''))
  }
}

const oldComments = () =>
  props.tab.comments.filter((c: TabComment) => newCommentIds.value.findIndex((id: string) => id === c.id) < 0)
const newComments = () =>
  props.tab.comments.filter((c: TabComment) => newCommentIds.value.findIndex((id: string) => id === c.id) >= 0)

const showSuggestion = () => {
  const url = chrome.runtime.getURL('www/index.html') + '#/mainpanel/suggestions/' + suggestion.value?.id
  NavigationService.openOrCreateTab([url])
}

const openImage = () =>
  window.open(chrome.runtime.getURL('www/index.html#/mainpanel/png/' + props.tab.id + '/' + pngs.value[0]!.id))

const showComments = () => props.showCommentsForMinimalDetails && props.tab.comments.length > 0

const showInReadingMode = () =>
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${props.tab.id}`))

const openTabAssignmentPage = (tab: Tab) =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL('/www/index.html#/mainpanel/tabAssignment/' + tab.id)])

const matcherTooltip = () => {
  const split = props.tab.matcher?.split('|')
  if (split && split.length > 1) {
    if (split[0] === 'sw') {
      // 'sw' = 'startsWith'
      return 'This tab will open in any tab with an URL starting with ' + split[1]
    }
  }
  return 'This tab will open in any tab which url matches ' + props.tab.matcher
}

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

const openTabset = (badge: any) => {
  console.log('clicked badge', badge)
  useTabsetService().selectTabset(badge.tabsetId)
  if (!inBexMode() || !chrome.sidePanel) {
    router.push('/sidepanel/tabsets/' + badge.tabsetId + '?highlight=' + badge.encodedUrl)
  } else {
    router.push('/sidepanel' + '?highlight=' + badge.encodedUrl)
  }
}
</script>
