<template>
  <q-page padding>

    <div class="text-h5 q-ml-md">
      Tab Details
    </div>


    <div class="row items-baseline q-mx-md q-my-none">
      <div class="col-2">
        <q-img
          class="rounded-borders"
          width="32px"
          height="32px"
          :src="notificationStore.selectedTab?.chromeTab?.favIconUrl">
          <q-tooltip>
            {{ notificationStore.selectedTab?.chromeTab?.favIconUrl }} / {{ notificationStore.selectedTab?.chromeTab?.id }}  / {{ notificationStore.selectedTab.id }}
          </q-tooltip>
        </q-img>
      </div>
      <div class="col-10 text-body1 ellipsis">
        {{ getHost(notificationStore.selectedTab?.chromeTab?.url, true) }}
      </div>
      <div class="col-12 text-body2 ellipsis">
        {{ notificationStore.selectedTab?.chromeTab?.title }}
      </div>

      <div class="col-12">
        <div class="text-overline ellipsis">
          {{ notificationStore.selectedTab?.chromeTab?.url }}&nbsp;<q-icon name="launch" color="secondary"
                                                                         @click.stop="Navigation.openOrCreateTab(tab.chromeTab?.url )"></q-icon>
        </div>
      </div>
    </div>
    <div class="row q-mx-md q-my-none" style="border:0 solid yellow">
      <div class="col-12">
        <q-img :src="thumbnail" width="512px" style="border:1px solid grey" />
      </div>
      <div class="col-12">
        <div class="row q-ma-sm">
          <div class="col-5">
            created
          </div>
          <div class="col-7">
            {{ date.formatDate(notificationStore.selectedTab?.created, 'DD.MM.YYYY HH:mm') }}
          </div>
          <div class="col-5">
            updated
          </div>
          <div class="col-7">
            {{ date.formatDate(notificationStore.selectedTab?.updated, 'DD.MM.YYYY HH:mm') }}
          </div>
          <div class="col-5">
            last Active
          </div>
          <div class="col-7">
            {{ date.formatDate(notificationStore.selectedTab?.lastActive, 'DD.MM.YYYY HH:mm') }}
          </div>
          <div class="col-5">
            activated#
          </div>
          <div class="col-7">
            {{ notificationStore.selectedTab?.activatedCount }}
          </div>

          <div class="col-5">
            Description
          </div>
          <div class="col-7">
            {{ notificationStore.selectedTab?.description }}
          </div>

          <div class="col-5">
            History
          </div>
          <div class="col-7">
            {{ notificationStore.selectedTab?.history }}
          </div>

          <div class="col-5" v-if="notificationStore.selectedTab?.bookmarkId">
            Bookmark ID
          </div>
          <div class="col-7" v-if="notificationStore.selectedTab?.bookmarkId">
            {{ notificationStore.selectedTab?.bookmarkId }}
          </div>

          <div class="col-5" v-if="notificationStore.selectedTab?.bookmarkUrl">
            Bookmark URL
          </div>
          <div class="col-7" v-if="notificationStore.selectedTab?.bookmarkUrl">
            {{ notificationStore.selectedTab?.bookmarkUrl }}
          </div>

          <div class="col-5">
            Meta Info
          </div>
          <div class="col-7">
            <div class="row" v-for="key in Object.keys(metas)">
              <div class="col-6">{{key}}</div>
              <div class="col-6">{{ metas[key] }}</div>
            </div>
          </div>

          <div class="col-5">
            Content
          </div>
          <div class="col-7">
            {{ content }}
          </div>
        </div>
      </div>
    </div>

    <fab></fab>
  </q-page>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import Fab from "src/components/Fab.vue"
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";
import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import Navigation from "src/services/Navigation";
import {date} from "quasar";

const tabsStore = useTabsStore()
const notificationStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const router = useRouter()

const thumbnail = ref('')
const content = ref('')
const metas = ref({})

watchEffect(() => {
  if (notificationStore.selectedTab) {
    TabsetService.getThumbnailFor(notificationStore.selectedTab)
      .then(data => thumbnail.value = data.thumbnail)
      .catch(err => console.log("err", err))
    TabsetService.getContentFor(notificationStore.selectedTab)
      .then(data => {
        content.value = data.content
        metas.value = data.metas
      })
      .catch(err => console.log("err", err))
  } else {
    router.push("/tabset")
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

</script>
