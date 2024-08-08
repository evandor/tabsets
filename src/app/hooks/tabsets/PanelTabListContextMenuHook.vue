<template>
  <q-item v-if="useFeaturesStore().hasFeature(FeatureIdent.RESEARCH_SESSIONS) && hasResearchData()"
          clickable v-close-popup @click.stop="openResearchPage()">
    <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
      <q-icon size="xs" name="o_science" color="info"/>
    </q-item-section>
    <q-item-section>
      Research
    </q-item-section>
  </q-item>

  <q-item clickable v-if="useFeaturesStore().hasFeature(FeatureIdent.RESEARCH_SESSIONS) && !hasResearchData()"
          v-close-popup @click="startResearch()">
    <q-item-section style="padding-right:0;min-width:25px;max-width: 25px;">
      <q-icon size="xs" name="o_science" color="primary"/>
    </q-item-section>
    <q-item-section>
      Start Research
    </q-item-section>
  </q-item>
  <!--  <q-separator inset/>-->
</template>

<script lang="ts" setup>

import {PropType} from "vue";
import {Tab} from "src/tabsets/models/Tab";
import {Tabset} from "src/tabsets/models/Tabset";
import {useRouter} from "vue-router";
import {BlobMetadata} from "src/snapshots/models/BlobMetadata";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {openURL} from "quasar";
import _ from "lodash"
import NavigationService from "src/services/NavigationService";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {FeatureIdent} from "src/models/FeatureIdent";

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  tabset: {type: Object as PropType<Tabset>, required: false}
})

const router = useRouter()

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

</script>
