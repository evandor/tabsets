<template>

  <q-page padding style="padding-top: 34px">

    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-md">

            <BookmarksTree
              :nodes="showOnlyFolders ? useBookmarksStore().nonLeafNodes : useBookmarksStore().bookmarksNodes2"
              :show-only-folders="showOnlyFolders"
              @toggle-show-only-folders="toggleShowOnlyFolders()"
              :in-side-panel="true"/>

          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper title="Bookmarks">

        <template v-slot:iconsRight>

          <SidePanelToolbarTabNavigationHelper />

          <SidePanelToolbarButton
              icon="close"
              tooltip="Close this view"
              @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
              color="black" />
        </template>

      </FirstToolbarHelper>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import BookmarksTree from "src/bookmarks/components/BookmarksTree.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {SidePanelView, useUiStore} from "stores/uiStore";
import {onMounted, ref} from "vue";
import Analytics from "src/core/utils/google-analytics";
import SidePanelToolbarTabNavigationHelper from "pages/sidepanel/helper/SidePanelToolbarTabNavigationHelper.vue";
import SidePanelToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";

const showOnlyFolders = ref(true)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelBookmarksPage', document.location.href);
})

const toggleShowOnlyFolders = () => {
  console.log("****")
  showOnlyFolders.value = !showOnlyFolders.value
}


// const onMessageListener = async (message: any, sender: any, sendResponse: any) => {
//   console.log(" <<< received message", message)
//   if (message.name === "sidepanel-switch-view") {
//     // const tsId = message.data.changedTabsetId
//     // await useTabsetService().reloadTabset(tsId)
//     // console.log("tsId", tsId)
//     // sortedSpaces.value = getSortedSpaces()
//     // tabsetsForSpaces.value = await getTabsetsForSpaces()
//     // randomKey.value = uid()
//     // //console.log("tabsetsForSpace", tabsetsForSpaces.value)
//   }
// }

</script>
