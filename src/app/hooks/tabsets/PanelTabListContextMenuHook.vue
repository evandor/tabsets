<template>
  <q-item
    v-if="useFeaturesStore().hasFeature(FeatureIdent.RESEARCH_SESSIONS) && hasResearchData()"
    clickable
    v-close-popup
    @click.stop="openResearchPage()"
  >
    <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
      <q-icon size="xs" name="o_science" color="info" />
    </q-item-section>
    <q-item-section> Research </q-item-section>
  </q-item>

  <q-item
    clickable
    v-if="useFeaturesStore().hasFeature(FeatureIdent.RESEARCH_SESSIONS) && !hasResearchData()"
    v-close-popup
    @click="startResearch()"
  >
    <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
      <q-icon size="xs" name="o_science" color="primary" />
    </q-item-section>
    <q-item-section> Start Research </q-item-section>
  </q-item>

  <q-item
    clickable
    v-if="route.path === '/sidepanel/top10List'"
    v-close-popup
    @click="resetActivationCounter()"
  >
    <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
      <q-icon size="xs" name="sym_o_reset_settings" color="primary" />
    </q-item-section>
    <q-item-section> Reset Activation Counter </q-item-section>
  </q-item>

  <!--  <q-separator inset/>-->
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { openURL } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
  tabset: { type: Object as PropType<Tabset>, required: false },
})

const router = useRouter()
const route = useRoute()

const openResearchPage = () => {
  openURL(props.tab.url!)
  router.push('/sidepanel/research/' + props.tab.id)
}

const hasResearchData = () =>
  _.find(useSnapshotsStore().metadata, (md: BlobMetadata) => md.sourceId === props.tab.id)

const startResearch = () => {
  NavigationService.openOrCreateTab([props.tab.url!])
  router.push('/sidepanel/research/' + props.tab.id)
}

const resetActivationCounter = () => {
  //const tab = props.tab
  const tabAndTabsetId = useTabsetsStore().getTabAndTabsetId(props.tab.id)
  console.log('resetting', tabAndTabsetId)
  if (tabAndTabsetId) {
    //const tab = _.find(tabset.tabs, (t:Tab) => t.id === props.tab.id)
    if (tabAndTabsetId.tab) {
      tabAndTabsetId.tab.activatedCount = 0
      const tabset = useTabsetsStore().getTabset(tabAndTabsetId.tabsetId)
      if (tabset) {
        useTabsetsStore().saveTabset(tabset)
      }
    }
  }
}
</script>
