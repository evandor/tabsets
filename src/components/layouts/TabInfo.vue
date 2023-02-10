<template>
  <div>
    <div class="row items-baseline q-mx-md q-pa-none" style="width:265px;border-top:1px dotted grey">
      <div class="col-12 q-mb-md">&nbsp;
        <q-banner v-if="notificationStore.selectedTab.isDuplicate"
                  rounded class="bg-amber-1 text-black">This tab has duplicates in this tabset
        </q-banner>
      </div>
    </div>

    <div class="row items-baseline q-mx-md q-my-none" style="width:265px">

      <div class="col-2">
        <TabFaviconWidget :tab="notificationStore.selectedTab" width="24ps" height="24px"/>
      </div>
      <div class="col-10 text-body1 ellipsis">
        {{ getHost(notificationStore.selectedTab.chromeTab?.url, true) }}
      </div>
      <div class="col-12 text-body2 ellipsis">
        {{ notificationStore.selectedTab.chromeTab?.title }}
      </div>

      <div class="col-12">
        <div class="text-overline ellipsis">
          {{ notificationStore.selectedTab.chromeTab.url }}&nbsp;<q-icon name="launch" color="secondary"
                                                                         class="cursor-pointer"
                                                                         @click.stop="NavigationService.openOrCreateTab(notificationStore.selectedTab.chromeTab?.url )"></q-icon>
        </div>
      </div>
    </div>

    <div class="row q-mx-md q-my-none" style="width:265px;border:0 solid yellow">
      <div class="col-12 text-right">
        <q-chip v-for="chip in tabsetChips()"
                class="cursor-pointer q-ml-xs" size="8px" clickable icon="tab" @click="openTabset(chip)">
          {{ chip.label }}
        </q-chip>
      </div>
    </div>

    <div class="row q-mx-md q-my-none" style="width:265px;border:0 solid yellow">

      <div class="col-12" v-if="hasAllUrlsPermission">
        <q-img :src="thumbnail" width="265px" style="border:1px solid grey;border-radius: 5px;" no-native-menu/>
      </div>
      <div class="col-12" v-else>
        <q-banner rounded class="bg-yellow-1 text-black" style="border:1px solid grey;border-radius: 5px;">
          If you want to have thumbnails of your tabs, additional permissions are needed.<br><br>
          Click <span class="cursor-pointer text-blue-6" style="text-decoration: underline"
                      @click="router.push('/features/thumbnails')">here</span> to
          grant permissions for the tabset extension to create thumbnails for your tabs.
        </q-banner>
      </div>

      <div class="col-3 text-left">
        <q-btn round size="11px"
               color="primary"
               flat
               icon="o_info">
          <q-tooltip>This tab was created {{ formatDate(notificationStore.selectedTab.created) }}, opened
            {{ notificationStore.selectedTab.activatedCount }} times and was last active
            {{ formatDate(notificationStore.selectedTab.lastActive) }}.
          </q-tooltip>
        </q-btn>

        <q-btn v-if="featuresStore.isEnabled('dev')"
               @click="showTabDetails"
               round size="11px"
               color="primary"
               flat
               icon="o_more_horiz">
          <q-tooltip>Show additional information about this tab (developer mode).</q-tooltip>
        </q-btn>
      </div>
      <div class="col-9 text-right">
        <q-btn round size="11px"
               :color="notificationStore.selectedTab.note && notificationStore.selectedTab.note.length > 0 ? 'white' : 'warning'"
               :style="notificationStore.selectedTab.note && notificationStore.selectedTab.note.length > 0 ? 'background: #FFBF46' : 'background: #ffffff'"
               flat
               icon="edit_note"
               @click.stop="editNoteDialog(notificationStore.selectedTab)">
          <q-tooltip>Add a note to this tab or edit it</q-tooltip>
        </q-btn>

        <q-btn flat round color="primary" size="11px" icon="o_schedule" @click.stop="scheduleTab()">
          <q-tooltip>Schedule this tab</q-tooltip>
        </q-btn>

        <q-btn flat round color="primary" size="11px" icon="save" @click.stop="saveTab(notificationStore.selectedTab)"
               :disabled="!isOpen(notificationStore.selectedTab)">
          <q-tooltip v-if="isOpen(notificationStore.selectedTab)">Save this tab</q-tooltip>
          <q-tooltip v-else>The tab must be open if you want to save it. Click on the link and come back here to save
            it.
          </q-tooltip>
        </q-btn>


      </div>

    </div>
  </div>


</template>

<script setup lang="ts">
import {useQuasar} from "quasar";
import {useNotificationsStore} from "src/stores/notificationsStore";
import NavigationService from "src/services/NavigationService"
import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {formatDistance} from "date-fns";
import {Tab} from "src/models/Tab";
import EditNoteDialog from "components/dialogues/EditNoteDialog.vue";
import MHtmlService from "src/services/MHtmlService";
import {usePermissionsStore} from "stores/permissionsStore";
import _ from "lodash";
import {useTabsetService} from "src/services/TabsetService2";

const notificationStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const router = useRouter()
const $q = useQuasar()

const thumbnail = ref('')
const content = ref('')
const hasAllUrlsPermission = ref<boolean | undefined>(false)
const {selectTabset} = useTabsetService()


watchEffect(() => hasAllUrlsPermission.value = usePermissionsStore().hasAllOrigins())

watchEffect(() => {
  if (notificationStore.selectedTab) {
    TabsetService.getThumbnailFor(notificationStore.selectedTab)
      .then(data => {
        if (data) {
          thumbnail.value = data.thumbnail
        } else {
          thumbnail.value = ''
        }
      })
    TabsetService.getContentFor(notificationStore.selectedTab)
      .then(data => {
        if (data) {
          content.value = data.content
        }
      })
  }
})
const tabsetChips = (): object[] => {
  const badges: object[] = []
  const url = notificationStore.selectedTab.chromeTab.url
  if (url) {
    _.forEach(useTabsetService().tabsetsFor(url), ts => badges.push({
      label: TabsetService.nameForTabsetId(ts),
      tabsetId: ts,
      encodedUrl: btoa(url || '')
    }))
  }
  // if (hit.bookmarkId) {
  //   badges.push({
  //     label: 'bookmark',
  //     bookmarkId: hit.bookmarkId,
  //     encodedUrl: btoa(hit.chromeTab.url || '')
  //   })
  // }
  return badges;
}


function getShortHostname(host: string) {
  const nrOfDots = (host.match(/\./g) || []).length
  if (nrOfDots >= 2) {
    return host.substring(host.indexOf(".", nrOfDots - 2) + 1)
  }
  return host
}

function getHost(urlAsString: string, shorten: Boolean = true): string {
  try {
    const url = new URL(urlAsString)
    if (!shorten) {
      return url.protocol + "://" + url.host.toString()
    }
    return getShortHostname(url.host)
  } catch (e) {
    return "---";
  }
}

const showTabDetails = () => {
  router.push("/tab/" + notificationStore.selectedTab.id)
}

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

const editNoteDialog = (tab: Tab) => {
  $q.dialog({
    component: EditNoteDialog,
    componentProps: {
      tabId: tab.id,
      note: tab.note
    }
  })
}

// TODO make command
const saveTab = (tab: Tab) => {
  if (!usePermissionsStore().hasPermission('pageCapture')) {
    console.log("missing permission pageCapture")
  } else if (tab.chromeTab.id) {
    console.log("capturing", tab.chromeTab)
    chrome.pageCapture.saveAsMHTML(
      {tabId: tab.chromeTab.id},
      (html: any) => {
        MHtmlService.saveMHtml(tab, html)
      }
    )
  }
}

function isOpen(tab: Tab): boolean {
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

const scheduleTab = () => {
  const tab = notificationStore.selectedTab
  $q.dialog({
    component: EditNoteDialog,
    componentProps: {
      tabId: tab.id,
      note: tab.note,
      schedule: true
    }
  })
}

const openTabset = (badge: any) => {
  selectTabset(badge.tabsetId)
  router.push("/tabsets/" + badge.tabsetId + "?highlight=" + badge.encodedUrl)
}


</script>
