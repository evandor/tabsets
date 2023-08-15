<template>

  <q-page style="padding-top: 50px">


    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none">

        <q-list  class="q-ma-none">
          <template v-for="hit in tabsetHits" v-if="tabsetHits.length > 0">
            <SearchHit :hit="hit"/>
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
    <q-page-sticky expand position="top" style="background-color:white">

      <FirstToolbarHelper
          :show-search-box="true"
          :search-term="searchStore.term"
          :search-hits="tabsetHits.length"
          :title="'Found ' + searchStore.term + ' ' + tabsetHits.length + ' time(s)'">
        <template v-slot:iconsRight>
          <q-btn
              icon="close"
              @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
              color="black"
              flat
              class="q-ma-none q-pa-xs cursor-pointer"
              style="max-width:20px"
              size="10px">
            <q-tooltip class="tooltip">Close this view</q-tooltip>
          </q-btn>
        </template>
      </FirstToolbarHelper>

    </q-page-sticky>

  </q-page>

  <!--  <q-toolbar class="text-primary lightgrey">-->
  <!--    <div class="row fit">-->
  <!--      <q-toolbar-title>-->
  <!--        <div class="row">-->
  <!--          <div class="col-2">-->
  <!--            <q-icon name="chevron_left" class="cursor-pointer" @click="router.push('/sidepanel')">-->
  <!--              <q-tooltip>Back</q-tooltip>-->
  <!--            </q-icon>-->
  <!--          </div>-->
  <!--          <div class="col-10" style="font-size:smaller">-->
  <!--            <span class="text-dark">Found '{{ searchStore.term }}' {{ tabsetHits.length }} time(s)</span>-->
  <!--          </div>-->
  <!--        </div>-->
  <!--      </q-toolbar-title>-->
  <!--    </div>-->
  <!--  </q-toolbar>-->

</template>

<script setup lang="ts">
import {onMounted, ref, watchEffect} from 'vue';
import {useRoute} from "vue-router";
import _ from "lodash"
import {useSearchStore} from "src/stores/searchStore";
import {uid, useQuasar} from "quasar";
import SearchHit from "src/components/layouts/SearchHit.vue"
import {Hit} from "src/models/Hit";
import ReindexDialog from "components/dialogues/ReindexDialog.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {SidePanelView, useUiStore} from "stores/uiStore";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import Analytics from "src/utils/google-analytics";

const route = useRoute()
const searchStore = useSearchStore()

const termFromParams = route.query.t as string

const $q = useQuasar()
const tabsetHits = ref<Hit[]>([])
const showReindexDialog = ref(false)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSearchPage', document.location.href);
})

const newSearch = (term: string) => {
  tabsetHits.value = []

  if (term && term.trim() !== '') {
    const results = searchStore.search(term)
    _.forEach(results, h => {
      //console.log("h", h.item.bookmarkId)
      const theHit = new Hit(
          uid(),
          //       ChromeApi.createChromeTabObject(h.item.title, h.item.url, h.item.favIconUrl),
          h.item.title,
          h.item.url,
          h.item.favIconUrl,
          0, 0,
          Math.round(100 - (100 * (h?.score || 1))),
          h.item.tabsets,
          [],
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

watchEffect(() => {
  if (showReindexDialog.value) {
    $q.dialog({
      component: ReindexDialog
    }).onDismiss(() => {
      showReindexDialog.value = false
    })
  }
})

const bookmarksEnabled = () => usePermissionsStore().hasPermission('bookmarks')
const grant = (permission: string) => useCommandExecutor().executeFromUi(new GrantPermissionCommand(permission))

</script>
