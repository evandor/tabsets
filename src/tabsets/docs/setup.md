## Setup

### AppService

In the initCoreSerivces method in the app/AppServices.vue file, make sure to add

```typescript
const tabsetsStore = useTabsetsStore()
// updates the registryStore whenever we have changes on 'tabsets'
watch(tabsetsStore.tabsets, (newTabsets: Map<string, any>) => {
  const tsInfo = _.map([...newTabsets.values()], (ts: any) => new TabsetInfo(ts.id, ts.name, ts.window, ts.tabs.length))
  registryStore.tabsetRegistry = tsInfo
})
// use the proper db connection (here: indexedDb)
await tabsetsStore.initialize(useDB().tabsetsIndexedDb)
await useTabsetService().init(false)
await useTabsStore2().initialize()
```

### Hooks

The following file has to be added to your application at '/src/app/hooks/tabsets/TabListIconIndicatorsHook.vue'

```typescript
<template>
  <q-icon v-if="showResearchIndicator"
    name="o_science" size="11px" color="primary" class="q-mr-xs">
    <q-tooltip class="tooltip-small">This Source has associcated reasearch data</q-tooltip>
  </q-icon>
</template>

<script lang="ts" setup>

import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {ref, watchEffect} from "vue";

const props = defineProps({
  tabId: {type: String, required: true}
})

const showResearchIndicator = ref(false)

watchEffect(async () => {
  showResearchIndicator.value = (await useSnapshotsStore().metadataFor(props.tabId)).length > 0
})

</script>

```

This file does not need to provide any logic, it is meant as a hook to add icons to the
list of tabs (TODO)

```typescript
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
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";

const props = defineProps({
  tab: {type: Object as PropType<Tab>, required: true},
  tabset: {type: Object as PropType<Tabset>, required: false}
})

const router = useRouter()

const openResearchPage = () => {
  window.open(chrome.runtime.getURL(`www/index.html#/mainpanel/mhtml/${props.tab.id}/0`));
  router.push('/sidepanel/research/' + props.tab.id)
}

const hasResearchData = () => {
  const mds: Map<string, BlobMetadata[]> = useSnapshotsStore().metadata
  return mds.get(props.tab.id)
}

const startResearch = () => {
  openURL(props.tab.url!)
  router.push('/sidepanel/research/' + props.tab.id)
}

</script>

```
