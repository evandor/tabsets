<template>
  <div class="column" style="height: 100%">
    <div class="col">
      <q-toolbar>
        <div class="row fit">
          <div class="col-xs-12 col-md-6">
            <q-toolbar-title>
              <div class="row justify-start items-baseline" v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)">
                <SpacesSelectorWidget />
              </div>
              <div class="row justify-start items-baseline" v-else>My Tabsets</div>
            </q-toolbar-title>
          </div>
          <div class="col-xs-12 col-md-6 text-right">
            <q-btn
              outline
              label="New Tabset"
              color="primary"
              size="sm"
              data-testid="addTabsetBtn"
              @click="addTabset()"
              class="q-ma-none q-ml-sm q-px-sm q-py-none q-mt-sm"
              name="o_bookmark_add" />

            <!--            <q-icon-->
            <!--              class="cursor-pointer" size="22px" color="warning"-->
            <!--              style="position: relative;top:5px;right:-2px"-->
            <!--              name="add_circle" @click="addTabset">-->
            <!--              <q-tooltip-->
            <!--                class="tooltip"-->
            <!--                :delay="200"-->
            <!--                anchor="center left" self="center right">-->
            <!--                {{ useFeaturesStore().hasFeature(FeatureIdent.SPACES) ?-->
            <!--                  'Click here to add a new tabset to the current Space':-->
            <!--                  'Click here to add a new tabset'}}-->
            <!--              </q-tooltip>-->
            <!--            </q-icon>-->
          </div>
        </div>
      </q-toolbar>

      <q-list class="q-mt-none greyBorderTop">
        <NavTabsetsListWidgetNonBex
          :tabsets="tabsets()"
          :space-id="useSpacesStore().space?.id || '0'"
          view-port="sidepanel" />
      </q-list>

      <q-separator v-if="tabsetsWithTypes([TabsetType.SPECIAL]).length > 0" />

      <NavTabsetsListWidgetNonBex :tabsets="tabsetsWithTypes([TabsetType.SPECIAL])" view-port="sidepanel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import SpacesSelectorWidget from 'src/spaces/widgets/SpacesSelectorWidget.vue'
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
</script>
