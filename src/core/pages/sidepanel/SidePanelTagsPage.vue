<template>
  <q-page style="padding-top: 50px">
    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none q-pt-sm">
        <template v-for="hit in tabsetHits">
          <q-list>
            <SearchHit :hit="hit" />
          </q-list>
        </template>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Tags Overview" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { uid } from 'quasar'
import SearchHit from 'src/core/components/layouts/SearchHit.vue'
import { TagInfo } from 'src/core/models/TagInfo'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import Analytics from 'src/core/utils/google-analytics'
import { Hit } from 'src/search/models/Hit'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTagsService } from 'src/tags/TagsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'

const tabsetHits = ref<Hit[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelTagsPage', document.location.href)
})

const newSearch = (term: string) => {
  console.log('term', term)
  tabsetHits.value = []

  if (term && term.trim() !== '') {
    const results = useTagsService()
      .getDynamicTabsBy([term])
      .map((it: IndexedTab) => it.tab)
    //const results: Tab[] = []

    // _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => {
    //   _.forEach(tabset.tabs, (tab: Tab) => {
    //     if (tab.tagsInfo?.map((t: TagInfo) => t.label).indexOf(term) >= 0) {
    //       //console.log("found tab", term, tab.tags)
    //       results.push(tab)
    //     }
    //   })
    // })

    _.forEach(results, (h: any) => {
      //console.log("h", h.item.bookmarkId)
      let tabsets: string[] = []
      if (h.url) {
        tabsets = useTabsetService().tabsetsFor(h.url)
      }
      const theHit = new Hit(
        uid(),
        //       h.chromeTab,
        h.title || '',
        h.url || '',
        h.favIconUrl || '',
        0,
        0,
        100,
        tabsets, //h.chromeTab.tabsets,
        [],
        _.map(h['matches' as keyof object], (m: any) => {
          return {
            key: m['key' as keyof object],
            indices: m['indices' as keyof object],
          }
        }),
        h.description,
        h.keywords,
      )
      if (h.bookmarkId) {
        theHit.bookmarkId = h.bookmarkId
      }
      tabsetHits.value.push(theHit)
    })
  }
}

watchEffect(() => {
  const tag = useUiStore().selectedTag
  if (tag && tag.trim() !== '') {
    newSearch(tag)
  }
})
</script>
