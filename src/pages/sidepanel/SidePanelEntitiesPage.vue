<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">

          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper title="Entity Manager">

        <template v-slot:iconsRight>

          <q-btn outline
                 label="New Entity"
                 color="primary"
                 size="sm"
                 @click="openNewEntityDialog()"
                 class="q-ma-none q-px-sm q-py-none"
                 name="o_apps" />

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

import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {SidePanelView, useUiStore} from "stores/uiStore";
import {onMounted} from "vue";
import Analytics from "src/utils/google-analytics";
import SidePanelToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
import {useQuasar} from "quasar";
import NewEntityDialog from "components/dialogues/NewEntityDialog.vue";

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelEntityManager', document.location.href);
})

const $q = useQuasar()

const openNewEntityDialog = () => {
  $q.dialog({
    component: NewEntityDialog,
    componentProps: {

    }
  })
}
</script>
