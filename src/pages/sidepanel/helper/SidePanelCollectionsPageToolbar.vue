<template>
  <!-- FirstToolbarHelper -->
  <q-toolbar class="text-primary q-pa-none q-pl-sm q-pr-xs q-pb-none greyBorderBottom" :style="offsetTop()">
    <q-toolbar-title>
      <div class="row q-ma-none q-pa-none">

        <div class="col-5 q-ma-none q-pa-none">

          <div class="col-12 text-subtitle1">
            <div class="q-ml-md q-mt-sm">
              <template v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
                <div class="text-caption cursor-pointer" @click.stop="router.push('/sidepanel/spaces')">{{
                    title()
                  }}
                </div>
              </template>
              <template v-else>
                <div class="text-caption">{{ title() }}</div>
              </template>
              <div class="text-body1 text-bold cursor-pointer">
                Select a Collection
              </div>
            </div>
          </div>

        </div>

        <div class="col-7 text-subtitle1 text-right q-ma-none q-pa-none q-pr-none q-pt-sm">

          <slot name="iconsRight">
            <SidePanelToolbarTabNavigationHelper/>
            <q-btn outline dense
                   icon="add"
                   label="Collection"
                   color="primary"
                   size="sm"
                   :class="{ shake: annimateNewTabsetButton }"
                   data-testid="addTabsetBtn"
                   @click="openNewTabsetDialog()"
                   class="q-ma-none q-pl-xs q-pr-sm q-py-xs"
                   name="o_bookmark_add"/>
          </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>

import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {useRouter} from "vue-router";
import {ref, watchEffect} from "vue";
import {useUiStore} from "src/ui/stores/uiStore";
import NewTabsetDialog from "src/tabsets/dialogues/NewTabsetDialog.vue";
import SidePanelToolbarTabNavigationHelper from "src/opentabs/pages/SidePanelToolbarTabNavigationHelper.vue";
import {useQuasar} from "quasar";
import {useI18n} from 'vue-i18n'
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {SidePanelViews} from "src/app/models/SidePanelViews";
import {useWindowsStore} from "src/windows/stores/windowsStore";
import {useTabsStore2} from "src/tabsets/stores/tabsStore2";
import {ActionHandlerButtonClickedHolder} from "src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder";
import {useActionHandlers} from "src/tabsets/actionHandling/ActionHandlers";
import {Tabset} from "src/tabsets/models/Tabset";

const {t} = useI18n({useScope: 'global'})

const props = defineProps({
  title: {type: String, default: "My Tabsets"},
  forceTitle: {type: Boolean, default: false},
  showSearchBox: {type: Boolean, default: false},
  searchTerm: {type: String, default: ''},
  searchHits: {type: Number, required: false}
})

const $q = useQuasar()
const router = useRouter()

const searching = ref(false)
const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)

const toggleSearch = () => {
  searching.value = !searching.value
  if (searching.value) {
    router.push("/sidepanel/search")
  } else {
    router.push("/sidepanel")
  }
}

windowLocation.value = window.location.href

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  const windowId = useWindowsStore().currentChromeWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

watchEffect(() => {
  annimateNewTabsetButton.value = useUiStore().animateNewTabsetButton
})

watchEffect(() => {
  if (props.showSearchBox && !searching.value) {
    searching.value = true
  }
})

watchEffect(() => {
  showFilter.value = useUiStore().sidePanelActiveViewIs(SidePanelViews.TABS_LIST) &&
    useUiStore().toolbarFilter
})

if ($q.platform.is.chrome && $q.platform.is.bex) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'search') {
      console.debug(`got Command: ${command}`);
      toggleSearch()
    }
  })
}

const title = (): string => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space ? useSpacesStore().space.label : t('no_space_selected')
  } else {
    return "Collection"
  }
}

const openNewTabsetDialog = () => {
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      tabsetId: useTabsetsStore().getCurrentTabset?.id,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true
    }
  })
}


const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova) ? 'margin-top:40px;' : ''

</script>

<style scoped>

.v-enter-active,
.v-leave-active {
  transition: opacity 3.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

</style>
