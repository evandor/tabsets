<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">
            <BookmarksTree :in-side-panel="true"/>
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">
      <FirstToolbarHelper title="Bookmarks" :show-back-button="true"/>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import BookmarksTree from "components/BookmarksTree.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";

</script>
