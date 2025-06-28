<template>
  <div class="q-ma-none" style="height: 100%; max-width: 100%">
    <q-scroll-area style="height: 100%">
      <template v-for="hit in tabsetHits">
        <q-list>
          <SearchHit :hit="hit" />
        </q-list>
      </template>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { uid } from 'quasar'
import SearchHit from 'src/core/components/layouts/SearchHit.vue'
import Analytics from 'src/core/utils/google-analytics'
import { Hit } from 'src/search/models/Hit'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'

const tabsetHits = ref<Hit[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('TagListViewer', document.location.href)
})

const newSearch = (term: string) => {
  tabsetHits.value = []

  if (term && term.trim() !== '') {
    const results: Tab[] = []

    _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => {
      _.forEach(tabset.tabs, (tab: Tab) => {
        if (tab.tags?.indexOf(term) >= 0) {
          console.log('found tab', term, tab.tags)
          results.push(tab)
        }
      })
    })

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
