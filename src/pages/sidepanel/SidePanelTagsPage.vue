<template>

  <q-page>
    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-2">
              <q-icon name="chevron_left" class="cursor-pointer" @click="router.push('/sidepanel/tagslist')">
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col-10" style="font-size:smaller">
              Tags List
            </div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="row fit greyBorderTop"></div>

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
  </q-page>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useRoute, useRouter} from "vue-router";
import {useTabsStore} from "src/stores/tabsStore";
import _ from "lodash"
import {useSearchStore} from "src/stores/searchStore";
import {Tabset} from "src/models/Tabset";
import {uid, useQuasar} from "quasar";
import SearchHit from "src/components/layouts/SearchHit.vue"
import ChromeApi from "src/services/ChromeApi";
import {Hit} from "src/models/Hit";
import ReindexDialog from "components/dialogues/ReindexDialog.vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {useUiStore} from "src/stores/uiStore";
import {Tab} from "src/models/Tab";
import {useTabsetService} from "src/services/TabsetService2";

const route = useRoute()
const tabsStore = useTabsStore()
const searchStore = useSearchStore()

const router = useRouter()

const $q = useQuasar()
const tabsetHits = ref<Hit[]>([])
const showReindexDialog = ref(false)

const newSearch = (term: string) => {
  tabsetHits.value = []

  if (term && term.trim() !== '') {
    const results: Tab[] = []

    _.forEach([...tabsStore.tabsets.values()], (tabset: Tabset) => {
      _.forEach(tabset.tabs, (tab: Tab) => {
        if (tab.tags?.indexOf(term) >= 0) {
          results.push(tab)
        }
      })
    })

    _.forEach(results, h => {
      //console.log("h", h.item.bookmarkId)
      let tabsets: string[] = []
      if (h.chromeTab.url) {
        tabsets = useTabsetService().tabsetsFor(h.chromeTab.url)
      }
      const theHit = new Hit(
        uid(),
        h.chromeTab,
        0, 0,
        100,
        tabsets, //h.chromeTab.tabsets,
        [],
        _.map(h['matches' as keyof object], (m: any) => {
          return {
            key: m['key' as keyof object],
            indices: m['indices' as keyof object]
          }
        }),
        h.description,
        h.keywords
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
