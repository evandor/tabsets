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
        <q-img
          class="rounded-borders"
          width="24px"
          height="24px"
          :src="notificationStore.selectedTab.chromeTab?.favIconUrl">
          <q-tooltip v-if="featuresStore.isEnabled('debug')">
            {{ notificationStore.selectedTab.chromeTab.favIconUrl }} / {{ notificationStore.selectedTab.chromeTab.id }}  / {{ notificationStore.selectedTab.id }}
          </q-tooltip>
        </q-img>
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
                                                                   @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )"></q-icon>
        </div>
      </div>
    </div>
    <div class="row q-mx-md q-my-none" style="width:265px;border:0 solid yellow">
      <div class="col-12">
        <q-img :src="thumbnail" width="265px" style="border:1px solid grey" @click="showTabDetails"/>
      </div>
      <div class="col-12">
        <div class="row q-ma-sm">
          <div class="col-5">
            created
          </div>
          <div class="col-7">
            {{ date.formatDate(notificationStore.selectedTab.created, 'DD.MM.YYYY HH:mm') }}
          </div>
          <div class="col-5">
            updated
          </div>
          <div class="col-7">
            {{ date.formatDate(notificationStore.selectedTab.updated, 'DD.MM.YYYY HH:mm') }}
          </div>
          <div class="col-5">
            last Active
          </div>
          <div class="col-7">
            {{ date.formatDate(notificationStore.selectedTab.lastActive, 'DD.MM.YYYY HH:mm') }}
          </div>
          <div class="col-5">
            activated#
          </div>
          <div class="col-7">
            {{ notificationStore.selectedTab.activatedCount }}
          </div>

          <div class="col-5">
            History
          </div>
          <div class="col-7">
            {{ notificationStore.selectedTab.history }}
          </div>

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
import {date} from "quasar";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import Navigation from "src/services/Navigation"
import {useRouter} from "vue-router";

const notificationStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const router = useRouter()

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
</script>
