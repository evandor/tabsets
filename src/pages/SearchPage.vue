<template>
  <q-page class="q-ma-lg">

    <q-toolbar class="text-primary">
      <div class="row fit">
        <div class="col-xs-12 col-md-5">
          <q-toolbar-title>
            <div class="row justify-start items-baseline">
              <div><span class="text-dark">Search Results for '{{
                  searchStore.term
                }}': {{ tabsetHits.length }} hit(s)</span>
              </div>
              <!--              <div class="text-caption q-mb-md">Not happy with the search results? Try <span-->
              <!--                class="text-blue-9 cursor-pointer" @click="showReindexDialog = true"><u>re-indexing</u></span>.-->
              <!--              </div>-->
            </div>
          </q-toolbar-title>
        </div>
        <div class="col-xs-12 col-md-7 text-right">

          <q-btn
            flat dense icon="restore_page"
            color="green" :label="$q.screen.gt.sm ? 'Search with browser...' : ''"
            class="q-mr-md"
            @click="searchWithBrowser">
            <q-tooltip>Use your browsers default search provideder to search for {{ searchStore.term }}</q-tooltip>
          </q-btn>

        </div>
      </div>
    </q-toolbar>

    <div class="row">
      <div class="col-8 q-ma-md">
        <template v-for="hit in tabsetHits">
          <q-list>
            <SearchHit :hit="hit"/>
          </q-list>
        </template>

      </div>
      <div class="col-4 q-ma-md">

      </div>
    </div>

    <div class="row" v-if="!bookmarksEnabled()">
      <div class="col-12 q-ma-md" style="border-top: 1px dotted grey">
        <q-banner class="text-caption bg-yellow-1">
          Tabsets can search your bookmarks as well, but is currently missing permissions to do so.<br>
          Click <span class="cursor-pointer text-blue-6" style="text-decoration: underline"
                      @click="grant('bookmarks')">here</span> to
          grant permissions for the tabset extension to access your bookmarks.
        </q-banner>
      </div>
    </div>


  </q-page>
</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useRoute} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {useSearchStore} from "src/stores/searchStore";
import {Tabset} from "src/models/Tabset";
import {uid, useQuasar} from "quasar";
import SearchHit from "src/components/layouts/SearchHit.vue"
import ChromeApi from "src/services/ChromeApi";
import {Hit} from "src/models/Hit";
import ReindexDialog from "components/dialogues/ReindexDialog.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";

const route = useRoute()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()

const termFromParams = route.query.t as string

const $q = useQuasar()
const tabsetHits = ref<Hit[]>([])
const showReindexDialog = ref(false)

const newSearch = (term: string) => {
  tabsetHits.value = []

  if (term && term.trim() !== '') {
    const results = searchStore.search(term)
    _.forEach(results, h => {
      //console.log("h", h.item.bookmarkId)
      const theHit = new Hit(
        uid(),
        ChromeApi.createChromeTabObject(h.item.title, h.item.url, h.item.favIconUrl), 0, 0,
        Math.round(100 - (100 * (h?.score || 1))),
        h.item.tabsets,
        _.map(h['matches' as keyof object], (m: any) => {
          return {
            key: m['key' as keyof object],
            indices: m['indices' as keyof object]
          }
        }),
        h.item.description,
        h.item.keywords
      )
      if (h.item.bookmarkId) {
        theHit.bookmarkId = h.item.bookmarkId
      }
      tabsetHits.value.push(theHit)
    })
  }
}

//console.log("termFromParams", termFromParams, route.query)
watchEffect (() => {
  if (termFromParams && termFromParams.trim() !== '') {
    console.log("setting search term from params", termFromParams)
    searchStore.term = termFromParams
  }
})

watchEffect(() => {
  // console.log("watch effect: searchStore.term", searchStore.term)
  if (searchStore.term?.trim() !== '') {
    newSearch(searchStore.term)
  }
})

watchEffect(() => {
  if (showReindexDialog.value) {
    $q.dialog({
      component: ReindexDialog
    }).onDismiss(() => {
      showReindexDialog.value = false
    })
  }
})

const searchWithBrowser = () => {
  // @ts-ignore
  chrome.search.query({disposition: 'NEW_TAB', text: searchStore.term})
}

const bookmarksEnabled = () => usePermissionsStore().hasPermission('bookmarks')
const grant = (permission: string) => useCommandExecutor().executeFromUi(new GrantPermissionCommand(permission))

</script>
