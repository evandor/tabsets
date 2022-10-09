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
          <q-tooltip v-if="featuresStore.debugEnabled">
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
          {{ notificationStore.selectedTab.chromeTab.url }}
        </div>
      </div>
    </div>
    <div class="row q-mx-md q-my-none" style="width:265px;border:0px solid yellow">
      <div class="col-12">
        <q-img :src="thumbnail" width="265px" style="border:1px solid grey"/>
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

          <div class="col-5">
            Content
          </div>
          <div class="col-7 ellipsis">
            {{ content }}
            <q-tooltip>{{ content }}</q-tooltip>
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
import {date, useQuasar} from "quasar";
import {useNotificationsStore} from "stores/notificationsStore";
import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";

const notificationStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()

const thumbnail = ref('')
const content = ref('')

watchEffect(() => {
  if (notificationStore.selectedTab) {
    TabsetService.getThumbnailFor(notificationStore.selectedTab)
      .then(data => thumbnail.value = data.thumbnail)
      .catch(err => console.log("err", err))
    TabsetService.getContentFor(notificationStore.selectedTab)
      .then(data => content.value = data.content)
      .catch(err => console.log("err", err))
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

function withoutHostname(url: string) {
  const splits = url?.split(getHost(url))
  if (splits?.length > 1) {
    return "..." + splits[1]
  }
  return "---"
}
</script>
