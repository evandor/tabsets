<template>

  <q-page style="padding-top: 50px">

    <div class="q-mt-md q-ma-none q-pa-none">
      <InfoMessageWidget
          :probability="1"
          ident="sidePanelTagsListViewer_overview"
          hint="Tabs you add are being tagged automatically (or you can tag them
            yourself). This is a list of the most used tags."/>
    </div>

    <div class="row q-ma-none q-pa-none">
      <div class="col-12 q-ma-none q-pa-none q-pt-sm">
        <TagsListViewerWidget @tagSelected="(value: string) => selectTag(value)"/>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">

      <FirstToolbarHelper title="Tags List">
        <template v-slot:iconsRight>

          <SidePanelToolbarTabNavigationHelper/>
          <CloseSidePanelViewButton />
        </template>
      </FirstToolbarHelper>

    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import {useNotificationHandler} from "src/core/services/ErrorHandler";
import {useUiStore} from "src/ui/stores/uiStore";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import InfoMessageWidget from "src/ui/widgets/InfoMessageWidget.vue";
import CloseSidePanelViewButton from "src/ui/components/CloseSidePanelViewButton.vue";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import {SidePanelViews} from "src/models/SidePanelViews";
import TagsListViewerWidget from "src/tabsets/widgets/TagsListViewerWidget.vue";

const {handleError} = useNotificationHandler()

const selectTag = (tag: string) => {
  console.log("selecting", tag)
  useUiStore().setSelectedTag(tag)
  useUiStore().sidePanelSetActiveView(SidePanelViews.TAG)
}

</script>
