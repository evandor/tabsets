<template>
  <!-- PanelTabListElementWidget2 -->
  <div class="q-pa-none fit" style="width: 100%">
    <!-- Main Line, always shown -->
    <div class="row" style="border: 0 solid blue; width: 100%">
      <div class="col-1 q-ml-sm q-mt-xs">
        <TabListIconItem2 :tabset="props.tabset!" :tab="tab" :detail-level="props.detailLevel" />
      </div>
      <div class="col q-ml-sm ellipsis">
        <div class="row fit">
          <div class="col q-mr-xs" style="border: 0 solid red">
            <TabListMainItem2
              :header="props.header"
              :tabset="props.tabset"
              :filter="props.filter || undefined"
              :tab="tab"
              :detail-level="props.detailLevel" />
          </div>
          <div
            class="text-right"
            :style="
              TabService.isCurrentTab(props.tab)
                ? 'border-right:3px solid #1565C0;border-radius:3px'
                : 'border-right:3px solid #F5F5F5;border-radius:3px'
            ">
            <slot name="actionPart">
              <template v-if="viewContext == 'popup'">
                <TabListActionsItem
                  :tabset="props.tabset!"
                  :tab="tab"
                  :detail-level="props.detailLevel"
                  :view-context="'popup'" />
              </template>
              <template v-else>
                <q-icon
                  v-if="(props.tab as Tab).placeholders"
                  name="sym_o_dynamic_feed"
                  size="16px"
                  class="q-ma-none q-pa-none"
                  color="primary"
                  @click.stop="toggleShowWith('placeholder')">
                  <q-tooltip class="tooltip-small">There are placeholders defined for this tab</q-tooltip>
                </q-icon>

                <q-icon
                  v-if="showReadingMode()"
                  name="o_menu_book"
                  size="16px"
                  class="q-ma-none q-pa-none"
                  color="primary"
                  @click.stop="showInReadingMode()">
                  <q-tooltip class="tooltip-small">Click here to open in Reading Mode</q-tooltip>
                </q-icon>

                <q-btn
                  v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0"
                  icon="o_chat"
                  flat
                  size="12px"
                  style="position: relative; top: 4px"
                  class="q-ma-none q-pa-none q-mx-xs"
                  @click.stop="toggleShowWith('comments')">
                  <q-badge floating color="warning" text-color="primary">{{ newCommentsCount() }}</q-badge>
                  <q-tooltip class="tooltip-small">There are comments for this tab</q-tooltip>
                </q-btn>

                <q-icon
                  v-if="props.tab.reminder"
                  color="primary"
                  name="o_alarm"
                  @click="openReminderDialog()"
                  size="16px">
                  <q-tooltip class="tooltip-small"
                    >Reminder set to {{ date.formatDate(props.tab.reminder, 'DD.MM.YYYY') }}
                    {{ props.tab.reminderComment ? ' - ' : '' }} {{ props.tab.reminderComment }}
                  </q-tooltip>
                </q-icon>

                <q-icon
                  v-if="monitor"
                  :name="monitor.changed ? 'o_notifications_active' : 'o_notifications'"
                  :color="monitor.changed ? 'negative' : 'primary'"
                  size="16px">
                  <q-tooltip v-if="monitor.changed" class="tooltip-small"
                    >Tab's content has changed, checked {{ date.formatDate(monitor.changed, 'DD.MM.YYYY hh:mm') }}
                  </q-tooltip>
                  <q-tooltip v-else class="tooltip-small">Tab is being monitored for content changes</q-tooltip>
                </q-icon>

                <q-icon
                  v-if="props.tab.pinnedInList && useUiStore().folderStyle === 'goInto'"
                  name="sym_o_keep"
                  size="16px"
                  class="q-ma-none q-pa-none"
                  style="cursor: default"
                  color="primary">
                  <q-tooltip class="tooltip-small">This tab is pinned, i.e. it appears in all subfolders</q-tooltip>
                </q-icon>

                <q-icon
                  v-if="
                    props.tab?.tabReferences?.filter(
                      (r: TabReference) => r.type === TabReferenceType.RSS && r.status !== 'IGNORED',
                    ).length > 0
                  "
                  name="sym_o_rss_feed"
                  size="16px"
                  class="q-ma-none q-pa-none cursor-pointer"
                  color="warning"
                  @click.stop="toggleShowWith('rssfeed')">
                  <q-tooltip class="tooltip-small">This tab links to an RSS Feed</q-tooltip>
                </q-icon>

                <TabListActionsItem
                  :tabset="props.tabset!"
                  :tab="tab"
                  :detail-level="props.detailLevel"
                  :view-context="props.viewContext" />
              </template>
            </slot>
          </div>
        </div>
      </div>
    </div>

    <!-- description -->
    <div
      class="row fit"
      v-if="showWithMinDetails('SOME') || props.tab?.details === 'SOME' || props.tab?.details === 'MAXIMAL'"
      style="border: 0 solid brown">
      <div class="col-1 q-ml-sm q-mt-xs">
        <div
          v-if="props.tab?.httpInfo === 'UPDATED'"
          class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
          style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
          NEW
          <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
        </div>

        <!--        <div v-if="props.tab.reminder || monitor" class="text-center">-->
        <!--          <q-icon v-if="props.tab.reminder" name="o_alarm" @click="openReminderDialog()" size="14px">-->
        <!--            <q-tooltip class="tooltip-small"-->
        <!--            >Reminder set to {{ date.formatDate(props.tab.reminder, 'DD.MM.YYYY') }}-->
        <!--              {{ props.tab.reminderComment ? ' - ' : '' }} {{ props.tab.reminderComment }}-->
        <!--            </q-tooltip>-->
        <!--          </q-icon>-->
      </div>
      <div class="col fit q-ml-sm">
        <div class="columns">
          <div
            class="col text-body2 q-mr-md q-my-xs text-blue-10"
            @click.stop="gotoTab()"
            :class="uiDensity === 'dense' ? 'ellipsis-2-lines ' : 'ellipsis-3-lines'">
            <Highlight :filter="props.filter" :text="props.tab.longDescription || props.tab.description || ''" />
          </div>
          <div class="col text-caption"></div>
        </div>
      </div>
    </div>

    <!-- === RestTab === -->
    <div v-if="'params' in props.tab && 'api' in props.tab">
      <!--      <div v-for="p in props.tab.params">-->
      <!--        <q-input type="text" v-model="p['val' as keyof object]" :label="p['name' as keyof object]" />-->
      <!--      </div>-->
      <div>
        <q-btn label="Call API" type="submit" @click="callRestApi(props.tab)" size="xs" />
      </div>
    </div>

    <!-- comments -->
    <div
      class="row fit"
      v-if="
        showCommentList ||
        showWithMinDetails('MAXIMAL') ||
        (props.tab?.details === 'MAXIMAL' && props.tab.comments.length > 0)
      "
      style="border: 0 solid brown">
      <div class="col-1 q-ml-sm q-mt-xs"></div>
      <div class="col">
        <template v-if="showCommentList">
          <div
            v-if="showCommentList"
            v-for="c in props.tab.comments.sort((a: TabComment, b: TabComment) => a.date - b.date)"
            class="row q-mr-md q-mt-sm q-pa-sm"
            :style="
              c.date > commentsUpdateThreshold
                ? 'border: 1px solid blue; border-radius: 3px'
                : 'border: 1px solid #efefef; border-radius: 3px'
            ">
            <div class="col-10 text-body2" @click.stop="editComment(c)">{{ c.comment }}</div>
            <div class="col text-right">
              <q-icon size="14px" color="primary" name="sym_o_delete" @click.stop="deleteComment(c)" />
            </div>
            <div class="col-12 text-right text-caption q-mt-xs">{{ formatDate(c.date) }}</div>
          </div>
          <div class="row">
            <div class="col-10 q-mx-sm">
              <q-input type="text" filled dense autogrow v-model="newComment" />
            </div>
            <div class="col q-pr-sm" style="border: 0 solid green; display: flex">
              <q-icon
                name="send"
                @click="addComment()"
                color="warning"
                style="align-self: center; margin-left: auto"
                :disable="!newComment" />
            </div>
          </div>
        </template>
        <div
          v-else-if="props.tab.comments.length > 0"
          class="q-ml-sm text-caption"
          @click.stop="showCommentList = !showCommentList">
          <q-icon name="sym_o_message" />
          Comments: {{ props.tab?.comments.length }}
        </div>
      </div>
    </div>

    <!-- rss feeds -->
    <div class="row fit" v-if="showPlaceholderList" style="border: 0 solid brown">
      <div class="col-1 q-ml-sm q-mt-xs"></div>
      <div class="col q-mr-xs">
        <Transition name="fade" mode="out-in">
          <q-item-label>
            <ul>
              <li v-for="placeholder in placeholders()">
                <short-url
                  @click.stop="useNavigationService().browserTabFor(placeholder.url)"
                  :label="placeholder.name"
                  :url="placeholder['url' as keyof object]"
                  :hostname-only="true" />
              </li>
            </ul>
          </q-item-label>
        </Transition>
      </div>
    </div>

    <!-- rss feeds -->
    <div
      class="row fit"
      v-if="
        showRssFeedList ||
        showWithMinDetails('MAXIMAL') ||
        (props.tab?.details === 'MAXIMAL' && props.tab.comments.length > 0)
      "
      style="border: 0 solid brown">
      <div class="col-1 q-ml-sm q-mt-xs"></div>
      <div class="col q-mr-xs">
        <Transition name="fade" mode="out-in">
          <q-item-label>
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
                <div class="col-7 cursor-pointer text-blue-8" style="font-size: smaller" @click="hideAll()">
                  Hide all
                </div>
                <div class="col text-right"></div>
              </div>
            </q-item-label>
          </q-item-label>
        </Transition>
      </div>
    </div>

    <!-- url -->
    <div
      class="row fit"
      v-if="showWithMinDetails('SOME') || props.tab?.details === 'SOME' || props.tab?.details === 'MAXIMAL'"
      style="border: 0 solid brown">
      <div class="col-1 q-ml-sm q-mt-xs">
        <div
          v-if="props.tab?.httpInfo === 'UPDATED'"
          class="q-my-xs q-mx-none q-pa-none text-white bg-positive items-center justify-center"
          style="border-radius: 3px; max-height: 15px; font-size: 8px; text-align: center">
          NEW
          <q-tooltip class="tooltip">This page indicates that its content has changed in the meantime.</q-tooltip>
        </div>

        <!--        <div v-if="props.tab.reminder || monitor" class="text-center">-->
        <!--          <q-icon v-if="props.tab.reminder" name="o_alarm" @click="openReminderDialog()" size="14px">-->
        <!--            <q-tooltip class="tooltip-small"-->
        <!--            >Reminder set to {{ date.formatDate(props.tab.reminder, 'DD.MM.YYYY') }}-->
        <!--              {{ props.tab.reminderComment ? ' - ' : '' }} {{ props.tab.reminderComment }}-->
        <!--            </q-tooltip>-->
        <!--          </q-icon>-->
      </div>
      <div class="col fit q-ml-sm">
        <div class="columns">
          <div class="col text-caption">
            <template v-if="props.tab.extension !== UrlExtension.RSS && props.tab.url">
              <short-url
                @click.stop="gotoTab()"
                :url="props.tab.url"
                :hostname-only="!useUiStore().showFullUrls"
                :filter="props.filter || ''" />
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- maximum details -->
    <div
      class="row fit"
      v-if="showOpenSearchInput() && (showWithMinDetails('MAXIMAL') || props.tab?.details === 'MAXIMAL')"
      style="border: 0 solid red">
      <div class="col-1 q-ml-sm q-mt-xs"></div>
      <div class="col fit q-ml-sm" @click="gotoTab()">
        <!-- === open search === -->
        <div class="q-pr-lg q-mt-none q-pt-none cursor-pointer">
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
        </div>

        <!-- === last active, reading time & icons === -->
        <div class="q-pr-xs q-mt-none q-pt-none cursor-pointer">
          <div class="row">
            <div class="col-9">
              <div class="text-caption text-grey-5 ellipsis">
                <q-icon
                  v-if="(props.tab as Tab).placeholders"
                  size="xs"
                  name="published_with_changes"
                  class="q-mr-xs"
                  color="accent">
                  <q-tooltip class="tooltip-small">This tab is created by substituting parts of its URL</q-tooltip>
                </q-icon>

                <!--            <q-btn-->
                <!--              v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 0"-->
                <!--              @click.stop="toggleLists('comments')"-->
                <!--              class="q-mr-xs q-mt-xs"-->
                <!--              color="warning"-->
                <!--              dense-->
                <!--              round-->
                <!--              flat-->
                <!--              icon="o_chat">-->
                <!--              <q-tooltip class="tooltip-small"-->
                <!--                >This tab has {{ newCommentIds.length > 0 ? 'new' : '' }} comments-->
                <!--              </q-tooltip>-->
                <!--              <q-badge v-if="newCommentIds.length > 0" color="accent" rounded floating transparent>-->
                <!--                {{ newCommentIds.length }}-->
                <!--              </q-badge>-->
                <!--            </q-btn>-->

                <span
                  v-if="(props.tab as Tab).comments && (props.tab as Tab).comments.length > 1"
                  @click.stop="toggleLists('comments')"
                  class="q-mr-sm q-ml-none"
                  >({{ (props.tab as Tab).comments.length }})</span
                >

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
            <div class="col text-caption text-right">
              <span v-if="tab.readingTime > 0 && showWithMinDetails('SOME')" class="text-grey-5">
                {{ formatReadingTime(tab.readingTime) }}
                <q-tooltip class="tooltip-small">cumulated reading time</q-tooltip>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { STRIP_CHARS_IN_USER_INPUT } from 'boot/constants'
import { formatDistance } from 'date-fns'
import { date, uid, useQuasar } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import TabListIconIndicatorsHook from 'src/app/hooks/tabsets/TabListIconIndicatorsHook.vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { ViewContext } from 'src/core/models/ViewContext'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType, useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import ShortUrl from 'src/core/utils/ShortUrl.vue'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { RestTab } from 'src/rest/models/RestTab'
import TabService from 'src/services/TabService'
import { Suggestion } from 'src/suggestions/domain/models/Suggestion'
import { useSuggestionsStore } from 'src/suggestions/stores/suggestionsStore'
import { AddCommentCommand } from 'src/tabsets/commands/AddCommentCommand'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { DeleteCommentCommand } from 'src/tabsets/commands/DeleteCommentCommand'
import { OpenTabCommand } from 'src/tabsets/commands/OpenTabCommand'
import AddRssFeedDialog from 'src/tabsets/dialogues/actions/AddRssFeedDialog.vue'
import CommentDialog from 'src/tabsets/dialogues/CommentDialog.vue'
import ReminderDialog from 'src/tabsets/dialogues/ReminderDialog.vue'
import { Tab, TabComment, UrlExtension } from 'src/tabsets/models/Tab'
import { MonitoredTab, Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import Highlight from 'src/tabsets/widgets/Highlight.vue'
import TabListActionsItem from 'src/tabsets/widgets/tabListItems/TabListActionsItem.vue'
import TabListIconItem2 from 'src/tabsets/widgets/tabListItems/TabListIconItem2.vue'
import TabListMainItem2 from 'src/tabsets/widgets/tabListItems/TabListMainItem2.vue'
import { ListDetailLevel, useUiStore } from 'src/ui/stores/uiStore'
import { inject, onMounted, PropType, ref, watchEffect } from 'vue'

const { handleError } = useNotificationHandler()
const { formatReadingTime } = useUtils()

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
  header: { type: String, required: false },
  filter: { type: String, required: false },
  detailLevel: { type: String as PropType<ListDetailLevel>, required: false },
  viewContext: { type: String as PropType<ViewContext>, default: 'default' },
})

const $q = useQuasar()

const uiDensity = inject('ui.density')

const suggestion = ref<Suggestion | undefined>(undefined)
const doShowDetails = ref(false)
const showCommentList = ref(false)
const showRssFeedList = ref(false)
const commentsUpdateThreshold = ref(0)
const showPlaceholderList = ref(false)
const opensearchterm = ref<string | undefined>(undefined)
const monitor = ref<MonitoredTab | undefined>(undefined)
const rssTabReferences = ref<TabReference[]>(
  props.tab.tabReferences?.filter((r: TabReference) => r.type === TabReferenceType.RSS && r.status !== 'IGNORED'),
)
const newComment = ref<string | undefined>(undefined)

onMounted(() => {
  commentsUpdateThreshold.value = props.tab.commentsLastUpdated || 0
  // if (props.tabset?.id) {
  //   newCommentIds.value = useEventsServices().listNewComments(props.tabset.id, props.tab)
  // }
  monitor.value =
    props.tabset &&
    props.tabset.monitoredTabs &&
    props.tabset.monitoredTabs.find((mt: MonitoredTab) => mt.tabId === props.tab.id)
})

watchEffect(() => {
  if (props.tab.url) {
    suggestion.value = useSuggestionsStore().getSuggestionForUrl(props.tab.url)
  }
})

const showInReadingMode = () =>
  useNavigationService().browserTabFor(chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${props.tab.id}`))

const showReadingMode = () => {
  if (props.tab) {
    const t: Tab = Object.assign(new Tab(props.tab.id, BrowserApi.createChromeTabObject('', '')), props.tab)
    return useFeaturesStore().hasFeature(FeatureIdent.READING_MODE) && t.hasTabReference(TabReferenceType.READING_MODE)
  }
  return false
}

const toggleLists = (ident: string) => {
  switch (ident) {
    case 'annotations':
      showCommentList.value = false
      break
    case 'comments':
      showCommentList.value = !showCommentList.value
      console.log('showCommentList set to', showCommentList.value)
      if (showCommentList.value && props.tab) {
        props.tab.commentsLastUpdated = new Date().getTime()
        console.log('***', props.tab.commentsLastUpdated)
      }
      break
    case 'placeholder':
      showPlaceholderList.value = !showPlaceholderList.value
      break
    case 'rssfeed':
      showRssFeedList.value = !showRssFeedList.value
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

const showWithMinDetails = (level: ListDetailLevel) => /*doShowDetails.value ||*/ showDetailsForThreshold(level)

const showDetailsForThreshold = (level: ListDetailLevel) =>
  useUiStore().listDetailLevelGreaterEqual(level, props.tabset?.details, props.detailLevel)

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

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

function hasReference(tab: Tab, refType: TabReferenceType) {
  const t: Tab = Object.assign(new Tab(tab.id, BrowserApi.createChromeTabObject('', '')), tab)
  return t.hasTabReference(refType)
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

const openReminderDialog = () =>
  $q.dialog({
    component: ReminderDialog,
    componentProps: { tabId: props.tab.id, date: props.tab.reminder, comment: props.tab?.reminderComment },
  })

const deleteComment = (c: TabComment) =>
  useCommandExecutor().executeFromUi(new DeleteCommentCommand(props.tab.id, c.id))

const editComment = (c: TabComment) => {
  const currentTs = useTabsetsStore().getCurrentTabset
  if (currentTs) {
    $q.dialog({
      component: CommentDialog,
      componentProps: { tabId: props.tab.id, sharedId: currentTs.sharing?.sharedId, comment: c },
    })
  }
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

const placeholders = (): { url: string; name: string }[] => {
  const phs: { url: string; name: string }[] = []
  if (props.tab.placeholders) {
    const subs = props.tab.placeholders.config
    Object.entries(subs).forEach((e) => {
      const name = e[0]
      const val = e[1]
      val.split(',').forEach((v: string) => {
        const substitution = v.trim()
        if (substitution.length > 0) {
          let useUrl = props.tab.url || ''
          let useName = props.tab.name || props.tab.title || ''
          Object.entries(subs).forEach((e1) => {
            useUrl = useUrl.replaceAll('${' + name + '}', substitution)
            useName = useName.replaceAll('${' + name + '}', substitution)
          })
          phs.push({ url: useUrl, name: substitution })
        }
      })
    })
  }
  return phs
}

const callRestApi = (tab: Tab) => {
  const restTab = tab as RestTab
  console.log(`about to call ${restTab.api} with ${JSON.stringify(restTab.params)}`)
  useNavigationService().browserTabFor(chrome.runtime.getURL('www/index.html/#/mainpanel/restapi/' + restTab.id))
}

const addComment = () => {
  if (newComment.value) {
    useCommandExecutor().executeFromUi(new AddCommentCommand(props.tab.id, newComment.value))
  }
}

const newCommentsCount = () =>
  props.tab.comments.filter((c: TabComment) => c.date > commentsUpdateThreshold.value).length

const showOpenSearchInput = () => (props.tab ? hasReference(props.tab, TabReferenceType.OPEN_SEARCH) : false)
</script>

<style lang="scss" src="src/tabsets/widgets/css/panelTabListElementWidget.scss" />
