<template>
  <div v-if="notificationStore.selectedTab">
    <div class="row items-baseline q-ma-xs" style="border:1px solid red">
      <div class="col-1">
        <q-img
          class="rounded-borders"
          width="20px"
          height="20px"
          :src="notificationStore.selectedTab.chromeTab?.favIconUrl">
        </q-img>
      </div>
      <div class="col-2 text-caption ellipsis">
        {{ getHost(notificationStore.selectedTab.chromeTab?.url, true) }}
      </div>
      <div class="col-9 text-body2 ellipsis">
        {{ notificationStore.selectedTab.chromeTab?.title }}
      </div>

      <div class="col-3"></div>
      <div class="col-9">
        <div class="text-overline ellipsis" >
          {{ notificationStore.selectedTab.chromeTab.url }}
        </div>
      </div>
    </div>
    <div class="row q-ma-xs" style="border:1px solid yellow">
      <div class="col-3">
        <q-img :src="thumbnail" width="300px"  />
      </div>
      <div class="col-9">
        <div class="row q-ma-lg">
          <div class="col-2">
            created / updated
          </div>
          <div class="col-10">
            {{ date.formatDate(notificationStore.selectedTab.created, 'DD.MM.YYYY HH:mm') }} /
            {{ date.formatDate(notificationStore.selectedTab.updated, 'DD.MM.YYYY HH:mm') }}
          </div>
          <div class="col-2">
            last Active
          </div>
          <div class="col-10">
            {{ notificationStore.selectedTab.lastActive }}
          </div>
          <div class="col-2">
            activated count
          </div>
          <div class="col-10">
            {{ notificationStore.selectedTab.activatedCount }}
          </div>
          <div class="col-2">
            HIstory
          </div>
          <div class="col-10">
            {{ notificationStore.selectedTab.history }}
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

const notificationStore = useNotificationsStore()
const thumbnail = ref('')

watchEffect(() => {
  if (notificationStore.selectedTab) {
    TabsetService.getThumbnailFor(notificationStore.selectedTab)
      .then(data => thumbnail.value = data)
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
