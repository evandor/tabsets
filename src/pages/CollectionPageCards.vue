<template>
  **{{ entitiesStore.getCurrentCollection(collectionType) }}**
  <hr>
  **{{entitiesStore.getCurrentCollection(collectionType.value)?.entities}}
  <hr>
  <q-card flat v-if="entitiesStore.getCurrentCollection(collectionType)?.view !== 'canvas'">
    <q-card-section>

      <TabList v-if="entitiesStore.getCurrentCollection(collectionType)?.view === 'list'"
               group="otherTabs"

               :tabs="getEntities()"/>

      <TabTable v-else-if="entitiesStore.getCurrentCollection(collectionType)?.view === 'table'"
                group="otherTabs"

                :tabs="getEntities()"/>

      <TabGroups v-else-if="entitiesStore.getCurrentCollection(collectionType)?.view === 'group'"
                 group="otherTabs"

                 :tabs="getEntities()"/>

      <TabsExporter v-else-if="entitiesStore.getCurrentCollection(collectionType)?.view === 'exporter'"
                    group="otherTabs"
                    :tabs="getEntities()"/>

    </q-card-section>

  </q-card>

</template>

<script lang="ts" setup>

import TabList from "components/layouts/TabList.vue";
import TabTable from "components/layouts/TabTable.vue";
import TabGroups from "components/layouts/TabGroups.vue";
import TabsExporter from "components/layouts/TabsExporter.vue";
import {useTabsStore} from "stores/tabsStore";
import {ref, watchEffect} from "vue";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import PageForTabset from "components/layouts/PageForTabset.vue";
import TabsCanvas from "components/layouts/TabsCanvas.vue";
import {useUiStore} from "stores/uiStore";
import {useRoute} from "vue-router";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {ToggleSortingCommand} from "src/domain/tabsets/ToggleSorting";
import {useEntitiesStore} from "stores/entitiesStore";

const entitiesStore = useEntitiesStore()
const route = useRoute()
const tabsetId = ref(null as unknown as string)
const collectionId = ref(null as unknown as string)
const collectionType = ref(null as unknown as string)
const showEditButton = ref(false)

const tab = ref('tabset')

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  collectionId.value = route?.params.collectionId as string
  if (collectionId.value) {
    console.log("got collectionId id", collectionId.value)
    //   const ts = tabsStore.selectCurrentTabset(collectionId.value)
  }
  collectionType.value = route?.params.type?.toString().toUpperCase() as string
  if (collectionType.value) {
    console.log("got collectionType id", collectionType.value)
    //   const ts = tabsStore.selectCurrentTabset(collectionId.value)
  }
})

function getEntities(): any[] {
  // return _.orderBy(entitiesStore.getCurrentEntities, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
  return entitiesStore.getCurrentCollection(collectionType.value)?.entities as unknown as any[]
}


</script>
