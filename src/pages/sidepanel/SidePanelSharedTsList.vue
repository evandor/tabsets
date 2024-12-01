<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">

      <InfoMessageWidget
        :probability="1"
        ident="sharedTabsetsView"
        hint="In this view, you will see all tabsets which are shared by you."/>

      <div class="q-pa-md q-gutter-sm">
        <q-banner v-if="sharedTabsets.length === 0"
                  inline-actions rounded class="text-primary" style="border: 1px solid grey">
          <div class="row q-pa-xs">
            <div class="2"></div>
            <div class="col text-caption">
              There are no shared tabsets (yet). Check this
              <span class="cursor-pointer text-primary" style="text-decoration: underline"
                    @click.stop="openURL('https://docs.tabsets.net/publishing')">page</span>
              to find out how to share tabsets.
            </div>
          </div>
        </q-banner>
      </div>

      <SidePanelTabsetsExpansionList :tabsets="sharedTabsets"/>


    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper2 title="Shared Tabsets">

        <template v-slot:iconsRight>
          <SidePanelToolbarTabNavigationHelper/>
          <CloseSidePanelViewButton/>
        </template>

      </FirstToolbarHelper2>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import InfoMessageWidget from "src/ui/widgets/InfoMessageWidget.vue";
import FirstToolbarHelper2 from "pages/sidepanel/helper/FirstToolbarHelper2.vue";
import Analytics from "src/core/utils/google-analytics";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import CloseSidePanelViewButton from "src/ui/components/CloseSidePanelViewButton.vue";
import {Tabset, TabsetSharing, TabsetStatus} from "src/tabsets/models/Tabset";
import _ from "lodash"
import {openURL} from "quasar";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const sharedTabsets = ref<Tabset[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSharedTsList', document.location.href);
})

watchEffect(() => {
  const tabsets: Tabset[] = [...useTabsetsStore().tabsets.values()] as Tabset[]
  sharedTabsets.value = _.filter(tabsets, (ts: Tabset) => ts.sharing !== undefined && ts.sharing !== TabsetSharing.UNSHARED && ts.status !== TabsetStatus.DELETED)
})

</script>
