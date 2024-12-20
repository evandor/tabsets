<template>

  <q-page padding style="padding-top: 34px">

    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-md">

            <BookmarksTree
              :nodes="showOnlyFolders ? useBookmarksStore().nonLeafNodes : useBookmarksStore().bookmarksNodes2"
              :show-only-folders="showOnlyFolders"
              :nodes-actions="'import'"
              @imported="(a:any) => imported(a)"
              @toggle-show-only-folders="toggleShowOnlyFolders()"
              :in-side-panel="true"/>

          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper2 title="Bookmarks">

        <template v-slot:iconsRight>

          <SidePanelToolbarTabNavigationHelper />

          <SidePanelToolbarButton
              icon="close"
              tooltip="Close this view"
              @click="useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)"/>
        </template>

      </FirstToolbarHelper2>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import BookmarksTree from "src/bookmarks/components/BookmarksTree.vue";
import FirstToolbarHelper2 from "pages/sidepanel/helper/FirstToolbarHelper2.vue";
import {useUiStore} from "src/ui/stores/uiStore";
import {onMounted, ref} from "vue";
import Analytics from "src/core/utils/google-analytics";
import SidePanelToolbarButton from "src/core/components/SidePanelToolbarButton.vue";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import {SidePanelViews} from "src/app/models/SidePanelViews";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useRoute} from "vue-router";
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useQuasar } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { CreateTabsetFromBookmarksRecursive } from 'src/domain/commands/CreateTabsetFromBookmarksRecursive'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { Tabset } from 'src/tabsets/models/Tabset'

const $q = useQuasar()

const showOnlyFolders = ref(true)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelBookmarksPage', document.location.href);
})

const toggleShowOnlyFolders = () => {
  showOnlyFolders.value = !showOnlyFolders.value
}

const imported = async (a:{ bmId: number, recursive: boolean, tsName: string }) => {

  console.log("importing bookmarks from", a)// bookmarkId.value, recursive.value)
  useUiStore().importedBookmarks = []
  $q.loadingBar?.start()

  // const tabset = await createTabsetFrom(a.tsName, "" + a.bmId)

  useCommandExecutor().execute(new CreateTabsetFromBookmarksRecursive(a.tsName, "" + a.bmId))
    .then(async (res: ExecutionResult<Tabset>) => {
      const tabset = res.result
      await useTabsetService().saveTabset(tabset)
      $q.loadingBar?.stop()
      // sendMsg('reload-tabset', {tabsetId: tabset.id})
      // sendMsg('sidepanel-switch-view', {view: 'main'})

      console.log("imported to tabset", tabset.id)
      // importedTabsetId.value = tabset.id

    })
    .catch((err: any) => {
      console.warn("error", err.toString())
      $q.loadingBar?.stop()
    })
}

</script>
