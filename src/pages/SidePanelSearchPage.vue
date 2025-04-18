<template>
  <!-- SidePanelSearchPage -->
  <q-page style="padding-top: 85px">
    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none">
        <q-list class="q-ma-none">
          <template v-for="hit in tabsetHits" v-if="tabsetHits.length > 0">
            <SearchHit :hit="hit" :in-side-panel="true" />
          </template>

          <template v-else>
            <div class="q-pa-md row items-start q-gutter-md fit">
              <q-card class="my-card fit">
                <q-card-section class="text-caption">
                  No Hits, please start typing or refine your search
                </q-card-section>
              </q-card>
            </div>
          </template>
        </q-list>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Search Results" />
      <SearchToolbarHelper :search-term="searchStore.term" :search-hits="tabsetHits.length" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { uid } from 'quasar'
import SearchHit from 'src/components/layouts/SearchHit.vue'
import SearchToolbarHelper from 'src/core/pages/sidepanel/helper/SearchToolbarHelper.vue'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import Analytics from 'src/core/utils/google-analytics'
import { Hit } from 'src/search/models/Hit'
import { useSearchStore } from 'src/search/stores/searchStore'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const searchStore = useSearchStore()

const termFromParams = route.query.t as string

const tabsetHits = ref<Hit[]>([])
const tabsetIdents = ref<object[]>([])
const tabIdents = ref<object[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSearchPage', document.location.href)
})

watchEffect(() => {
  const tabsets = [...useTabsetsStore().tabsets.values()] as Tabset[]
  tabsetIdents.value = _.map(tabsets, (t: Tabset) => {
    return {
      name: t.name,
      id: t.id,
    }
  })
  tabIdents.value = tabsets
    .flatMap((ts: Tabset) => ts.tabs)
    .filter((t: Tab) => t.quickaccess && t.quickaccess.trim().length > 0)
    .map((t: Tab) => {
      return {
        name: t.name,
        quickaccess: t.quickaccess,
        url: t.url,
        favIconUrl: t.favIconUrl,
        description: t.description,
        id: t.id,
      }
    })
})

const newSearch = (term: string) => {
  tabsetHits.value = []

  if (term && term.trim() !== '') {
    console.log('got term', term)

    // quick access hits
    tabIdents.value.forEach((tabIdent: any) => {
      const name = tabIdent['name' as keyof object]
      const quickaccess = tabIdent['quickaccess' as keyof object]
      const id = tabIdent['id' as keyof object]
      if (quickaccess.toLowerCase().indexOf(term.toLowerCase()) >= 0) {
        const theHit = new Hit(
          uid(),
          name,
          tabIdent['url' as keyof object],
          tabIdent['favIconUrl' as keyof object],
          0,
          0,
          1,
          [],
          [],
          [],
          tabIdent['description' as keyof object],
          'Quick Access',
        )
        tabsetHits.value.push(theHit)
      }
    })

    // tabsets' names hits
    tabsetIdents.value.forEach((tabsetIdent: any) => {
      const name = tabsetIdent['name' as keyof object]
      const id = tabsetIdent['id' as keyof object]
      if (name.toLowerCase().indexOf(term.toLowerCase()) >= 0) {
        const pseudoHit = new Hit('tabset|' + name, name, '', '', 0, 0, 0, [id], [], [], '', '')
        tabsetHits.value.push(pseudoHit)
      }
    })

    const results = searchStore.search(term)
    _.forEach(results, (h: any) => {
      //console.log("h", h.item.bookmarkId)
      const theHit = new Hit(
        uid(),
        h.item.title,
        h.item.url,
        h.item.favIconUrl,
        0,
        0,
        Math.round(100 - 100 * (h?.score || 1)),
        h.item.tabsets,
        [],
        _.map(h['matches' as keyof object], (m: any) => {
          return {
            key: m['key' as keyof object],
            indices: m['indices' as keyof object],
          }
        }),
        h.item.description,
        h.item.keywords,
      )
      // if (h.item.bookmarkId) {
      //   theHit.bookmarkId = h.item.bookmarkId
      // }
      tabsetHits.value.push(theHit)
    })

    //console.log("added hits", tabsetHits.value)
  }
}

//console.log("termFromParams", termFromParams, route.query)
watchEffect(() => {
  if (termFromParams && termFromParams.trim() !== '') {
    // console.log("setting search term from params", termFromParams)
    searchStore.term = termFromParams
  }
})

watchEffect(() => {
  //console.log("watch effect: searchStore.term", searchStore.term)
  if (searchStore.term?.trim() !== '') {
    newSearch(searchStore.term)
  }
})
</script>
