<template>

  <q-page padding style="padding-top: 34px">

    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">

          <div class="col-12 q-mx-sm q-my-none q-pa-none q-pt-md cursor-pointer text-accent" style="font-size: smaller"
               @click="router.push('/sidepanel/welcome')">
            ... or create a new collection manually
          </div>
          <div class="col-12 q-mx-sm q-my-none q-pa-none cursor-pointer text-accent" style="font-size: smaller"
               @click="gotoSettingsPage()">
            ... or import from existing backup
          </div>

          <div class="col-12 q-ma-sm q-pa-none q-pt-md text-grey">
            Select a folder and click the import icon
            <q-icon name="upload_file" size="xs"/>
            to add your
            bookmarks as a new collection.
          </div>
          <div class="col-12 q-mx-sm q-mt-md q-mb-none cursor-pointer text-center" v-if="importedTabsetId">
            <q-btn label="open Imported Tabset" outline @click="openImportedTabset()"/>
          </div>

          <div class="col-12 q-ma-none q-pa-none q-pt-md">

            <BookmarksTree
              :nodes="useBookmarksStore().nonLeafNodes"
              :nodes-actions="'import'"
              @imported="(a:any) => imported(a)"
              :show-only-folders="true"
              :show-filter="false"
              :show-toggle="false"
              :in-side-panel="true">
            </BookmarksTree>

          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <q-toolbar class="text-primary q-pa-none q-pl-sm q-pr-xs q-pb-none greyBorderBottom">
        <q-toolbar-title>
          <div class="row q-ma-none q-pa-none">
            Import From Bookmarks
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import BookmarksTree from "src/bookmarks/components/BookmarksTree.vue";
import {onMounted, ref} from "vue";
import Analytics from "src/core/utils/google-analytics";
import {useBookmarksStore} from "src/bookmarks/stores/bookmarksStore";
import {useRouter} from "vue-router";
import NavigationService from "src/services/NavigationService";
import {useTabsetService} from "src/tabsets/services/TabsetService2";

const router = useRouter()

const importedTabsetId = ref<string | undefined>(undefined)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelBookmarksPage', document.location.href);
})

const gotoSettingsPage = () => NavigationService.openOrCreateTab([chrome.runtime.getURL('/www/index.html#/mainpanel/settings?tab=importExport')])

const imported = (a:{tabsetId: string}) => {
  console.log("Imported", a)
  importedTabsetId.value = a.tabsetId
}

const openImportedTabset = () => {
  useTabsetService().selectTabset(importedTabsetId.value)
  router.push("/sidepanel")
}
</script>
