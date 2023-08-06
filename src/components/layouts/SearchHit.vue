<template>

  <q-item v-ripple class="q-mb-lg" @click="NavigationService.openOrCreateTab(hit.url )">

    <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.MEDIUM)"
                    class="q-mr-sm text-right" style="justify-content:start;width:25px;max-width:25px">
      <div class="bg-grey-3 q-pa-xs" style="border:0 solid grey;border-radius:3px">

        <q-img
            class="rounded-borders"
            style="cursor: move"
            width="16px"
            height="16px"
            :src="getFaviconUrl(hit.url, hit.favIconUrl)">
          <q-tooltip>drag and drop to tabset</q-tooltip>
        </q-img>

      </div>
    </q-item-section>

    <!-- name, title, description, url && note -->
    <q-item-section class="q-mb-sm">

      <!-- name or title -->

      <q-item-label>
        <div>
          <div class="q-pr-sm cursor-pointer ellipsis">
            <span>{{ hit.name ? hit.name : hit.title }}</span>
          </div>

        </div>
      </q-item-label>

      <!-- description -->
      <q-item-label class="ellipsis-2-lines text-grey-8"
                    @click.stop="NavigationService.openOrCreateTab(hit.url || '' )">
        {{ hit.description }}
      </q-item-label>

      <!-- url -->
      <q-item-label
          style="width:100%"
          caption class="ellipsis-2-lines text-blue-10">
        <div class="row q-ma-none">
          <div class="col-10 q-pr-lg cursor-pointer"
               @click.stop="NavigationService.openOrCreateTab(hit.url )">


            <!-- url or note -->

            <short-url :url="hit.url" :hostname-only="true"/>

            <template v-for="badge in tabsetBadges(hit)">
              <q-chip v-if="badge.bookmarkId"
                      class="cursor-pointer q-ml-md" size="9px" clickable icon="o_bookmark" color="warning"
                      @click="openBookmark(badge)">
                {{ badge.label }}
              </q-chip>
              <q-chip v-else
                      class="cursor-pointer q-ml-md" size="9px" clickable icon="tab" @click="openTabset(badge)">
                {{ badge.label }}
              </q-chip>
            </template>


            <!--            <div class="text-caption text-grey-5">-->
            <!--              {{ formatDate(hit.lastActive) }}-->
            <!--            </div>-->

            <!-- <q-icon class="q-ml-xs" name="open_in_new"/>-->
          </div>

        </div>

      </q-item-label>

      <!--      &lt;!&ndash; note &ndash;&gt;-->
      <!--      <q-item-label v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.LARGE) &&-->
      <!--      props['tab' as keyof object]['note']"-->
      <!--                    class="text-grey-10" text-subtitle1>-->
      <!--        <q-icon color="blue-10" name="edit_note"/>-->
      <!--        <div class="ellipsis-2-lines">-->
      <!--          {{ props['tab']['note'] }}-->
      <!--        </div>-->
      <!--      </q-item-label>-->

      <!--      <q-item-label v-if="props.showTabsets">-->
      <!--        <template v-for="badge in tsBadges">-->
      <!--          <q-chip class="cursor-pointer q-ml-none q-mr-xs" size="9px" icon="tab">-->
      <!--            {{ badge.label }}-->
      <!--          </q-chip>-->
      <!--        </template>-->
      <!--      </q-item-label>-->

    </q-item-section>


  </q-item>

<!--  <q-item v-ripple autofocus class="q-mb-lg">-->

<!--    <q-item-section>-->
<!--      <q-item-label class="ellipsis text-black" caption-->
<!--                    v-html="formatText(hit, 'url',hit.url || '', '#FFFFDD')"></q-item-label>-->
<!--      <q-item-label class="text-blue-9 text-h6">-->

<!--        <FaviconWidget :url="hit.url" :favicon="hit.favIconUrl"/>-->

<!--        <span class="cursor-pointer underline-on-hover q-ml-sm text-subtitle1" style="font-weight:400"-->
<!--              @click="NavigationService.openOrCreateTab(hit.url )"-->
<!--              v-html="formatText(hit, 'title',hit.title || '', '#FFFFDD')"></span>-->
<!--        <template v-for="badge in tabsetBadges(hit)">-->
<!--          <q-chip v-if="badge.bookmarkId"-->
<!--                  class="cursor-pointer q-ml-md" size="9px" clickable icon="o_bookmark" color="warning"-->
<!--                  @click="openBookmark(badge)">-->
<!--            {{ badge.label }}-->
<!--          </q-chip>-->
<!--          <q-chip v-else-->
<!--                  class="cursor-pointer q-ml-md" size="9px" clickable icon="tab" @click="openTabset(badge)">-->
<!--            {{ badge.label }}-->
<!--          </q-chip>-->
<!--        </template>-->
<!--      </q-item-label>-->

<!--      <q-item-label caption v-html="formatText(hit, 'description', hit.description || '', '#FFFFDD')"></q-item-label>-->
<!--      <q-item-label style="font-style:italic" caption-->
<!--                    v-html="formatText(hit, 'keywords', hit.keywords || '', '#FFFFDD')"></q-item-label>-->
<!--      <q-item-label class="text-blue-2 q-mb-sm" v-if="settingsStore.isEnabled('debug')">Match in:-->
<!--        {{ _.map(hit['matches'], m => m['key']).join(", ") }}-->
<!--      </q-item-label>-->
<!--      &lt;!&ndash;      <q-item-label caption>{{ hit['matches'] }}</q-item-label>&ndash;&gt;-->

<!--      <span>-->
<!--        <q-rating-->
<!--            v-model="scoreAsRating"-->
<!--            size="13px"-->
<!--            color="warning"-->
<!--            readonly-->
<!--        />-->
<!--        &lt;!&ndash;        {{ hit.score }}%&ndash;&gt;-->
<!--      </span>-->
<!--    </q-item-section>-->

<!--  </q-item>-->


</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab, UrlExtension} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {ref} from "vue";
import {Hit} from "src/models/Hit";
import _ from "lodash"
import {useRouter} from "vue-router";
import BookmarksService from "src/services/BookmarksService";
import {useTabsetService} from "src/services/TabsetService2";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import FaviconWidget from "components/widgets/FaviconWidget.vue";
import {useSettingsStore} from "src/stores/settingsStore"
import {useUtils} from "src/services/Utils";
import {ListDetailLevel, useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";
import ShortUrl from "components/utils/ShortUrl.vue";
import PanelTabListContextMenu from "components/widgets/helper/PanelTabListContextMenu.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";

const props = defineProps({
  hit: {
    type: Hit,
    required: true
  }
})

const emits = defineEmits(['sendCaption'])

const router = useRouter()
const settingsStore = useSettingsStore()
const line = ref(null);
const scoreAsRating = ref(Math.round(props.hit.score / 18))
const {inBexMode} = useUtils()

const {selectTabset} = useTabsetService()

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
  NavigationService.closeTab(tab)
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
  //console.log("tabUrl", tab.url);
  return TabsetService.isOpen(tab?.url || '')
}

const setInfo = (tab: Tab) => {
  const parts = (tab.url || '').split('?')
  if (parts.length > 1) {
    emits('sendCaption', parts[0] + "[... params omitted....]")
  } else if (parts.length === 1) {
    emits('sendCaption', parts[0].toString());
  }
}

const tabsetBadges = (hit: Hit): object[] => {
  const badges: object[] = []
  _.forEach(hit.tabsets, ts => badges.push({
    label: TabsetService.nameForTabsetId(ts),
    tabsetId: ts,
    encodedUrl: btoa(hit.url || '')
  }))
  if (hit.bookmarkId) {
    badges.push({
      label: 'bookmark',
      bookmarkId: hit.bookmarkId,
      encodedUrl: btoa(hit.url || '')
    })
  }
  return badges;
}

const openTabset = (badge: any) => {
  selectTabset(badge.tabsetId)
  // @ts-ignore
  if (!inBexMode() || !chrome.sidePanel) {
    router.push("/tabsets/" + badge.tabsetId + "?highlight=" + badge.encodedUrl)
  } else {
    // router.push("/sidepanel/spaces/" + badge.tabsetId + "?highlight=" + badge.encodedUrl)
    router.push("/sidepanel" + "?highlight=" + badge.encodedUrl)
  }

}

const openBookmark = (badge: any) => {
  console.log("badge", badge)
  BookmarksService.expandTreeForBookmarkId(badge.bookmarkId)
      .then(parentId => {
        router.push("/bookmarks/" + parentId + "?highlight=" + badge.bookmarkId)
      })
}

const formatText = (hit: Hit, key: string, text: string, color: string) => {

  let urlMatch: object[] = _.filter(hit.matches, (m: object) => m['key' as keyof object] === key)
  if (urlMatch && urlMatch.length > 0) {
    //console.log("urlMatch", urlMatch[0])
    //console.log("indices", urlMatch[0]['indices' as keyof object])
    let res = ''
    let offset = 0
    let begin = '<span style="background-color:' + color + '">'
    let end = '</span>'

    const indices = urlMatch[0]['indices' as keyof object] as unknown as any[]

    let startString = text

    indices.forEach(match => {
      const from = match[0] + offset
      const to = match[1] + offset
      res = startString.substring(0, from) + begin
      res += startString.substring(from, to + 1) + end
      res += startString.substring(to + 1)
      offset += begin.length + end.length
      startString = res
    })
    return res
  }

  return text
}

const getFaviconUrl = (url: string, favIconUrl: string | undefined) => {
  if (url.startsWith("chrome")) {
    return 'favicon-unknown-32x32.png'
  }
  if (favIconUrl) {
    return favIconUrl
  }
  if (!useSettingsStore().isEnabled('noDDG')) {
    let theUrl = url
    let theRealUrl
    try {
      theRealUrl = new URL(theUrl)
    } catch (err) {
      if (!theUrl.startsWith('http')) {
        theUrl = 'https://' + theUrl
        try {
          theRealUrl = new URL(theUrl)
        } catch (err) {
        }
      }
    }
    return theRealUrl ? "https://icons.duckduckgo.com/ip3/" + theRealUrl.hostname + ".ico" : 'favicon-unknown-32x32.png'
  }
  return 'favicon-unknown-32x32.png'
}


</script>

<style lang="sass">
.underline-on-hover:hover
  text-decoration: underline
</style>
