<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none cursor-pointer" v-for="e in entities">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">
            {{e.name}}
            [<span @click="NavigationService.openSingleTab('/www/index.html#/mainpanel/entities/' +  e.id + '/items')">Add</span>]
            [<span @click="NavigationService.openSingleTab('/www/index.html#/mainpanel/entities/' +  e.id)">Manage</span>]
          </div>
          <div class="col-12">
            <ul>
              <li v-for="i in e.items">{{i}}</li>
            </ul>
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
                 name="o_apps"/>

          <SidePanelToolbarButton
            icon="close"
            tooltip="Close this view"
            @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)"
            color="black"/>
        </template>

      </FirstToolbarHelper>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import {SidePanelView, useUiStore} from "stores/uiStore";
import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/utils/google-analytics";
import SidePanelToolbarButton from "components/buttons/SidePanelToolbarButton.vue";
import {openURL, useQuasar} from "quasar";
import NewEntityDialog from "components/dialogues/NewEntityDialog.vue";
import {Entity} from "src/models/Entity";
import {useEntitiesStore} from "stores/entitiesStore";
import NavigationService from "src/services/NavigationService";

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelEntityManager', document.location.href);
})

const $q = useQuasar()

const entities = ref<Entity[]>([])

watchEffect(() => {
  entities.value = useEntitiesStore().getEntities
  console.log("***got entites", entities.value)
})

const openNewEntityDialog = () => {
  $q.dialog({
    component: NewEntityDialog,
    componentProps: {}
  })
}
</script>
