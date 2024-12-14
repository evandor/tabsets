<template>

  <q-item v-ripple class="q-mb-lg">

    <q-item-section v-if="useUiStore().listDetailLevelGreaterEqual(ListDetailLevel.SOME, undefined)"
                    @click.stop="open(hit)"
                    class="q-mr-sm text-right" style="justify-content:start;width:25px;max-width:25px">
      <div class="bg-grey-3 q-pa-xs" style="border:0 solid grey;border-radius:3px">

        <q-img
          class="rounded-borders"
          width="16px"
          height="16px"
          :src="getFaviconUrl(hit.id, hit.url, hit.favIconUrl)">
        </q-img>

      </div>
    </q-item-section>

    <!-- name, title, description, url && note -->
    <q-item-section class="q-mb-sm cursor-pointer ellipsis" @click.stop="open(hit)">

      <!-- name or title -->

      <q-item-label>
        <div>
          <div class="q-pr-sm cursor-pointer ellipsis" v-if="isTabsetHit(hit)">
            <span class="text-bold">{{ hit.name ? hit.name : hit.title }}</span>
          </div>
          <div class="q-pr-sm cursor-pointer ellipsis" v-else>
            <span>{{ hit.name ? hit.name : hit.title }}</span>
          </div>
        </div>
      </q-item-label>

      <!-- description -->
      <q-item-label class="ellipsis-2-lines text-grey-8" v-if="isTabsetHit(hit)" @click.stop="open(hit)">
        Tabset
      </q-item-label>
      <q-item-label class="ellipsis-2-lines text-grey-8" v-else
                    @click.stop="NavigationService.openOrCreateTab([hit.url || ''] )">
        {{ hit.description }}
      </q-item-label>

      <!-- url -->
      <q-item-label v-if="hit.url"
                    style="width:100%"
                    caption class="ellipsis-2-lines text-accent">
        <div class="row q-ma-none">
          <div class="col-10 q-pr-lg cursor-pointer"
               @click.stop="open(hit)">
            <short-url :url="hit.url" :hostname-only="true"/>
          </div>

        </div>

      </q-item-label>

      <q-item-label>
        <template v-for="badge in tabsetBadges(hit)" v-if="!isTabsetHit(hit)">
          <q-chip v-if="badge['bookmarkId' as keyof object]"
                  class="cursor-pointer q-ml-none q-mr-sm" size="9px" clickable icon="o_bookmark" color="warning"
                  @click.stop="openBookmark(badge)">
            {{ badge['label' as keyof object] }}
          </q-chip>
          <q-chip v-else
                  class="cursor-pointer q-ml-none q-mr-sm" size="9px" clickable icon="tab"
                  @click="openTabset(badge['tabsetId' as keyof object], badge['encodedUrl' as keyof object])">
            {{ badge['label' as keyof object] }}
          </q-chip>
        </template>
      </q-item-label>

    </q-item-section>


  </q-item>

</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import TabsetService from "src/tabsets/services/TabsetService";
import {Hit} from "src/search/models/Hit";
import _ from "lodash"
import {useRouter} from "vue-router";
import BookmarksService from "src/bookmarks/services/BookmarksService";
import {useTabsetService} from "src/tabsets/services/TabsetService2";
import {useSettingsStore} from "src/stores/settingsStore"
import {useUtils} from "src/core/services/Utils";
import {ListDetailLevel, useUiStore} from "src/ui/stores/uiStore";
import ShortUrl from "src/core/utils/ShortUrl.vue";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {SelectTabsetCommand} from "src/tabsets/commands/SelectTabsetCommand";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useTabsetsUiStore} from "src/tabsets/stores/tabsetsUiStore";

const props = defineProps({
  hit: {type: Hit, required: true},
  inSidePanel: {type: Boolean, default: false}
})

const emits = defineEmits(['sendCaption'])

const router = useRouter()
const {inBexMode} = useUtils()

const {selectTabset} = useTabsetService()

const tabsetBadges = (hit: Hit): object[] => {
  const badges: object[] = []
  _.forEach(hit.tabsets, (ts: string) => badges.push({
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

const openTabset = (tabsetId: string, encodedUrl: string | undefined = undefined) => {
  selectTabset(tabsetId)
  let navigateTo = ""
  // @ts-ignore
  if (!inBexMode() || !chrome.sidePanel) {
    navigateTo = "/tabsets/" + tabsetId
  } else {
    navigateTo = "/sidepanel"
  }
  if (encodedUrl) {
    navigateTo += "?highlight=" + encodedUrl
  }
  router.push(navigateTo)
}

const openBookmark = (badge: any) => {
  console.log("badge", badge)
  // BookmarksService.expandTreeForBookmarkId(badge.bookmarkId)
  //   .then(parentId => {
  //     if (props.inSidePanel) {
  //       const url = chrome.runtime.getURL("www/index.html#/mainpanel/bookmarks/" + parentId + "?highlight=" + badge.bookmarkId)
  //       NavigationService.openOrCreateTab([url])
  //     } else {
  //       router.push("/bookmarks/" + parentId + "?highlight=" + badge.bookmarkId)
  //     }
  //   })
}

const getFaviconUrl = (hitId: string, url: string, favIconUrl: string | undefined) => {
  if (hitId.startsWith("tabset|")) {
    return 'folder.png'
  }
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

const isTabsetHit = (hit: Hit) => hit.id.startsWith('tabset|')

const open = (hit: Hit) => {
  if (hit.id.startsWith("tabset|")) {
    const tabsetId = hit.tabsets[0]
    if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
      const tabset = useTabsetsStore().getTabset(tabsetId!)
      const spaceId = (tabset && tabset.spaces.length > 0) ? tabset.spaces[0] : undefined
      console.log("selecting tabset/space", tabsetId, spaceId)
      useSpacesStore().setSpace(spaceId)
      useCommandExecutor().execute(new SelectTabsetCommand(tabsetId!))
    } else {
      useCommandExecutor().execute(new SelectTabsetCommand(tabsetId!))
    }
    //useTabsetsUiStore().addTabsetToLastUsedList(tabsetId)
    openTabset(tabsetId!)
  } else {
    NavigationService.openOrCreateTab([hit.url || ''])
  }
}

</script>

<style lang="sass">
.underline-on-hover:hover
  text-decoration: underline
</style>
