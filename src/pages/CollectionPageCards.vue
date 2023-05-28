<template>
  **{{ entitiesStore.getCurrentCollection(collectionType) }}**
  <hr>
  **{{ entitiesStore.getCurrentCollection(collectionType.value)?.entities }}
  <hr>
  <q-card flat v-if="entitiesStore.getCurrentCollection(collectionType)?.view !== 'canvas'">
    <q-card-section>

      <CollectionList v-if="entitiesStore.getCurrentCollection(collectionType)?.view === 'list'"
                      group="otherTabs"
                      :type="collectionType"
                      :collectionId="collectionId"
                      :entities="getEntities()"/>

    </q-card-section>

  </q-card>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {useEntitiesStore} from "src/stores/entitiesStore";
import CollectionList from "components/layouts/CollectionList.vue";

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
