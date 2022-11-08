<template>


  <q-item v-ripple autofocus>
    <q-item-section avatar>

      <q-img
        class="rounded-borders"
        width="20px"
        height="20px"
        :src="hit.chromeTab?.favIconUrl">
        <q-tooltip>{{ hit.chromeTab?.id }} / {{ hit.id }}</q-tooltip>
      </q-img>

    </q-item-section>
    <q-item-section avatar>

      {{ hit.score }}%

    </q-item-section>
    <q-item-section>
      <q-item-label class="ellipsis">{{ hit.chromeTab?.title }}
        <template v-for="badge in tabsetBadges(hit)">
          <q-chip class="cursor-pointer" clickable icon="tab" @click="openTabset(badge)">{{ badge.label }}</q-chip>
        </template>
      </q-item-label>
      <q-item-label class="ellipsis" caption>{{ hit.chromeTab?.url }}</q-item-label>
      <q-item-label class="ellipsis" caption>{{ hit.description }}</q-item-label>
      <q-item-label class="text-blue-2" v-if="featureToggles.debugEnabled">Match in: {{ hit['matches'].join(", ")}}</q-item-label>
    </q-item-section>
    <q-item-section avatar>
      <q-icon name="launch" color="primary" @click.stop="Navigation.openOrCreateTab(hit.chromeTab?.url )"></q-icon>
    </q-item-section>
  </q-item>


</template>

<script setup lang="ts">
import Navigation from "src/services/Navigation";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {ref} from "vue";
import {Hit} from "src/models/Hit";
import _ from "lodash"
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";

const props = defineProps({
  hit: {
    type: Hit,
    required: true
  }
})

const emits = defineEmits(['sendCaption'])

const router = useRouter()
const featureToggles = useFeatureTogglesStore()
const line = ref(null);

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

function closeTab(tab: Tab) {
  Navigation.closeTab(tab)
}

function cardStyle(tab: Tab) {
  const height = "100px"
  let borderColor = ""
  if (isOpen(tab)) {
    borderColor = "border-color:#8f8f8f"
  }
  if (tab.selected) {
    borderColor = "border-color:#000066"
  }

  let background = ''
  if (tab.isDuplicate) {
    background = "background: radial-gradient(circle, #FFFFFF 0%, #FFECB3 100%)"
  }
  // style=""
  return `height: ${height};max-height:${height}; min-height: ${height};${borderColor};${background}`
}

function isOpen(tab: Tab): boolean {
  //console.log("tabUrl", tab.chromeTab?.url);
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

const setInfo = (tab: Tab) => {
  const parts = (tab.chromeTab?.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}

const tabsetBadges = (hit:Hit): object[] => {
  const badges: object[] = []
  _.forEach(hit.tabsets, ts => badges.push({
    label: TabsetService.nameForTabsetId(ts),
    tabsetId: ts,
    encodedUrl: btoa(hit.chromeTab.url || '')
  }))
  return badges;
}

const openTabset = (badge: any) => {
  console.log("badge", badge)
  TabsetService.selectTabset(badge.tabsetId)
  router.push("/tabset?highlight="+badge.encodedUrl)
}


</script>
