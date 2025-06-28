<template>
  <q-layout view="lHh lpr lFf" container style="height: 100%">
    <q-header class="q-pa-none q-mt-none darkInDarkMode brightInBrightMode">
      <q-toolbar>
        <q-toolbar-title>
          <div class="row justify-start" v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
            <SpacesSelectorWidget />
          </div>
          <div class="row justify-start items-baseline" v-else>My Tabsets</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-none">
        <q-list class="q-mt-none greyBorderTop">
          <NavTabsetsListWidgetNonBex
            :tabsets="tabsets()"
            :space-id="useSpacesStore().space?.id || '0'"
            view-port="fullpage" />
        </q-list>

        <q-separator v-if="tabsetsWithTypes([TabsetType.SPECIAL]).length > 0" />

        <NavTabsetsListWidgetNonBex :tabsets="tabsetsWithTypes([TabsetType.SPECIAL])" view-port="fullpage" />
      </q-page>
    </q-page-container>

    <q-footer class="q-pa-none q-mt-sm darkInDarkMode brightInBrightMode">
      <!--      <template v-if="useFeaturesStore().hasFeature(FeatureIdent.TABSET_LIST)">-->
      <!--        <SidePanelTabsetListMarkup />-->
      <!--      </template>-->

      <SidePanelMessagesMarkup />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import SpacesSelectorWidget from 'src/spaces/widgets/SpacesSelectorWidget.vue'
import SidePanelMessagesMarkup from 'src/tabsets/components/helper/SidePanelMessagesMarkup.vue'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import NavTabsetsListWidgetNonBex from 'src/tabsets/widgets/NavTabsetsListWidgetNonBex.vue'
import { useUiStore } from 'src/ui/stores/uiStore'

const spacesStore = useSpacesStore()

const $q = useQuasar()

$q.loadingBar.setDefaults({
  color: 'green',
  size: '10px',
  position: 'bottom',
})

const tabsets = (): Tabset[] => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES) && spacesStore.spaces && spacesStore.spaces.size > 0) {
    if (spacesStore.space && spacesStore.space.id && spacesStore.space.id.length > 0) {
      tabsets = _.filter(
        tabsets,
        (ts: Tabset) =>
          ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.indexOf(spacesStore.space.id) >= 0,
      )
    } else {
      tabsets = _.filter(
        tabsets,
        (ts: Tabset) => ts.status !== TabsetStatus.ARCHIVED && ts.spaces && ts.spaces.length === 0,
      )
    }
  }
  return _.sortBy(
    _.filter(
      tabsets,
      (ts: Tabset) =>
        ts.type !== TabsetType.SPECIAL && ts.status !== TabsetStatus.ARCHIVED && ts.status !== TabsetStatus.DELETED,
    ),
    [
      function (o: any) {
        return o.status === TabsetStatus.FAVORITE ? 0 : 1
      },
      function (o: any) {
        return o.name.toLowerCase()
      },
    ],
  )
}

const tabsetsWithTypes = (types: TabsetType[]) => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  return _.sortBy(
    _.filter(tabsets, (ts: Tabset) => types.findIndex((t) => ts.type === t && TabsetStatus.DELETED !== ts.status) >= 0),
    ['name'],
  )
}

const addTabset = () =>
  $q.dialog({
    component: NewTabsetDialog,
    componentProps: {
      setEmptyByDefault: useUiStore().newTabsetEmptyByDefault,
    },
  })

const tabsetChanged = () => {
  // currentTabset.value = useTabsetsStore().getCurrentTabset
}
</script>
