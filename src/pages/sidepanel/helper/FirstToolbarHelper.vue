<template>
  <q-toolbar class="text-primary lightgrey q-pa-none q-pl-sm q-pr-xs q-pb-none">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">
        <div v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)"
             class="col-8 q-ma-none q-pa-none">
          <SearchWidget v-if="searching"
                        :fromPanel="true"
                        style="position: absolute; left:5px;top:5px;max-width:240px"/>
          <div class="column q-ma-none q-pa-none" v-else>
            <div class="col q-ma-none q-pa-none cursor-pointer"
                 @click="router.push('/sidepanel/spaces')">
              {{ useSpacesStore().space ? useSpacesStore().space.label : 'no space selected' }}
            </div>
          </div>
        </div>
        <div v-else class="col-8 q-ma-none q-pa-none">
          <SearchWidget v-if="searching"
                        :fromPanel="true"
                        style="position: absolute; left:5px;top:5px;max-width:240px"/>
          <template v-else>

            <div class="row" v-if="props.showBackButton">
              <div class="col-2">
                <q-icon
                  size="md"
                  name="chevron_left" class="cursor-pointer"
                  @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)">
                  <q-tooltip>Back</q-tooltip>
                </q-icon>
              </div>
              <div class="col">
                {{ props.title }}
              </div>
            </div>
            <div v-else>
              {{ props.title }}
            </div>


          </template>
        </div>
        <div class="col-4 text-right">

          <q-btn v-if="tabsStore.tabsets.size > 1"
                 icon="search"
                 flat
                 class="q-ma-none q-pa-xs cursor-pointer"
                 style="max-width:20px"
                 size="11px"
                 @click="toggleSearch">
            <q-tooltip class="tooltip">Search</q-tooltip>
          </q-btn>

          <!--                  <q-btn-->
          <!--                    icon="o_add"-->
          <!--                    flat-->
          <!--                    class="q-ma-none q-pa-xs cursor-pointer"-->
          <!--                    style="max-width:20px"-->
          <!--                    size="11px"-->
          <!--                    @click="openNewTabsetDialog()">-->
          <!--                    <q-tooltip class="tooltip">Add new Tabset</q-tooltip>-->
          <!--                  </q-btn>-->

          <q-btn
            v-if="tabsStore.tabsets.size > 1 && useSettingsStore().isEnabled('dev')"
            icon="o_keyboard_double_arrow_right"
            flat
            class="q-ma-none q-pa-xs cursor-pointer"
            style="max-width:20px"
            size="11px"
            @click="openTabsetPage()">
            <q-tooltip class="tooltip">Open this Tabset as Standalone page</q-tooltip>
          </q-btn>

        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>

import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {useSpacesStore} from "stores/spacesStore";
import SearchWidget from "components/widgets/SearchWidget.vue";
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";
import {ref} from "vue";
import NavigationService from "src/services/NavigationService";
import {useSettingsStore} from "stores/settingsStore";
import {SidePanelView, useUiStore} from "stores/uiStore";

const props = defineProps({
  title: {type: String, default: "Tabset"},
  showBackButton: {type: Boolean, default: false}
})

const router = useRouter()
const tabsStore = useTabsStore()

const searching = ref(false)

const toggleSearch = () => searching.value = !searching.value

const openTabsetPage = () => {
  const tabsetId = tabsStore.getCurrentTabset?.id
  if (tabsetId) {
    const extensionUrl = chrome.runtime.getURL('www/index.html#/mainpanel/tabsets/' + tabsetId)
    NavigationService.openOrCreateTab(extensionUrl)
  }
  router.push("/sidepanel/spaces")
}

</script>
