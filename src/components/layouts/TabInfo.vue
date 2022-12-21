<template>
  <div v-if="notificationStore.selectedTab">
    <div class="row items-baseline q-mx-md q-pa-none" style="width:265px;border-top:1px dotted grey">
      <div class="col-12 q-mb-md">&nbsp;
        <q-banner v-if="notificationStore.selectedTab.isDuplicate"
                  rounded class="bg-amber-1 text-black">This tab has duplicates in this tabset
        </q-banner>
      </div>
    </div>

    <div class="row items-baseline q-mx-md q-my-none" style="width:265px">
      <div class="col-2">
        <TabFaviconWidget :tab="notificationStore.selectedTab" width="24ps" height="24px" />
      </div>
      <div class="col-6 text-body1 ellipsis">
        {{ getHost(notificationStore.selectedTab.chromeTab?.url, true) }}
      </div>
      <div class="col-4 text-right">
        <q-btn round size="11px"
               :color="notificationStore.selectedTab.note && notificationStore.selectedTab.note.length > 0 ? 'white' : 'warning'"
               :style="notificationStore.selectedTab.note && notificationStore.selectedTab.note.length > 0 ? 'background: #FFBF46' : 'background: #ffffff'"
               flat
               icon="edit_note"
               @click.stop="editNoteDialog(notificationStore.selectedTab)">
          <q-tooltip>Add a note to this tab or edit it</q-tooltip>
        </q-btn>

        <q-btn flat round color="positive" size="11px" icon="save" @click.stop="saveTab(notificationStore.selectedTab)"
               :disabled="!isOpen(notificationStore.selectedTab)">
          <q-tooltip v-if="isOpen(notificationStore.selectedTab)">Save this tab</q-tooltip>
          <q-tooltip v-else>The tab must be open if you want to save it. Click on the link and come back here to save
            it.
          </q-tooltip>
        </q-btn>


      </div>
      <div class="col-12 text-body2 ellipsis">
        {{ notificationStore.selectedTab.chromeTab?.title }}
      </div>

      <div class="col-12">
        <div class="text-overline ellipsis">
          {{ notificationStore.selectedTab.chromeTab.url }}&nbsp;<q-icon name="launch" color="secondary" class="cursor-pointer"
                                                                   @click.stop="NavigationService.openOrCreateTab(notificationStore.selectedTab.chromeTab?.url )"></q-icon>
        </div>
      </div>
    </div>
    <div class="row q-mx-md q-my-none" style="width:265px;border:0 solid yellow">

      <div class="col-12">
        <q-img :src="thumbnail" width="265px" style="border:1px solid grey;border-radius: 5px;">
          <div class="absolute-bottom text-subtitle1 text-center">
            <q-btn flat round color="positive" size="22px" icon="schedule" @click.stop="saveTab(notificationStore.selectedTab)"
                   :disabled="!isOpen(notificationStore.selectedTab)">
              <q-tooltip v-if="isOpen(notificationStore.selectedTab)">Save this tab</q-tooltip>
              <q-tooltip v-else>The tab must be open if you want to save it. Click on the link and come back here to save
                it.
              </q-tooltip>
            </q-btn>
          </div>
        </q-img>
      </div>

      <div class="col-12">
        <div class="row q-ma-sm">
          <div class="col-5">
            Created
          </div>
          <div class="col-7">
            {{ formatDate(notificationStore.selectedTab.created) }}
            <q-tooltip>this tab was created at
              {{ date.formatDate(notificationStore.selectedTab.created, 'DD.MM.YYYY HH:mm') }}
            </q-tooltip>
          </div>
          <div class="col-5">
            Updated
          </div>
          <div class="col-7">
            {{ formatDate(notificationStore.selectedTab.updated) }}
            <q-tooltip>this tab was updated at
              {{ date.formatDate(notificationStore.selectedTab.updated, 'DD.MM.YYYY HH:mm') }}
            </q-tooltip>
          </div>
          <div class="col-5">
            Last Active
          </div>
          <div class="col-7">
            {{ formatDate(notificationStore.selectedTab.lastActive) }}
            <q-tooltip>this tab was last active at
              {{ date.formatDate(notificationStore.selectedTab.lastActive, 'DD.MM.YYYY HH:mm') }}
            </q-tooltip>
          </div>
          <div class="col-5">
            opened
          </div>
          <div class="col-7">
            {{ notificationStore.selectedTab.activatedCount }}x
          </div>

<!--          <div class="col-5">-->
<!--            History-->
<!--          </div>-->
<!--          <div class="col-7">-->
<!--            {{ notificationStore.selectedTab.history }}-->
<!--          </div>-->

          <div class="col-5" v-if="notificationStore.selectedTab.bookmarkId">
            Bookmark ID
          </div>
          <div class="col-7" v-if="notificationStore.selectedTab.bookmarkId">
            {{ notificationStore.selectedTab.bookmarkId }}
          </div>

          <div class="col-5" v-if="notificationStore.selectedTab.bookmarkUrl">
            Bookmark URL
          </div>
          <div class="col-7" v-if="notificationStore.selectedTab.bookmarkUrl">
            {{ notificationStore.selectedTab.bookmarkUrl }}
          </div>
        </div>
      </div>
    </div>
  </div>


</template>

<script setup lang="ts">
import {date, useQuasar} from "quasar";
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

const notificationStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const router = useRouter()
const $q = useQuasar()

const thumbnail = ref('')
const content = ref('')

watchEffect(() => {
  if (notificationStore.selectedTab) {
    TabsetService.getThumbnailFor(notificationStore.selectedTab)
      .then(data => {
        if (data) {
          thumbnail.value = data.thumbnail
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
  if (useFeatureTogglesStore().isEnabled('debug')) {
    router.push("/tab/" + notificationStore.selectedTab.id)
  }
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

function isOpen(tab: Tab): boolean {
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

</script>
