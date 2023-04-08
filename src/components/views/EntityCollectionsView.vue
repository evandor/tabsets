<template>
  <q-btn @click="openDialog" label="create new collection" size="12px"/>

  <ul v-for="notesCollection in [...collections.values()]">
    <li @click="openEntityCollection(notesCollection.id)">{{ notesCollection.name }}</li>
  </ul>
</template>

<script lang="ts" setup>

import {useQuasar} from "quasar";
import {useTabsStore} from "stores/tabsStore";
import NewEntityCollectionDialog from "components/dialogues/NewEntityCollectionDialog.vue";
import {ref, watchEffect} from "vue";
import {Collection} from "src/models/Collection";
import {useEntitiesStore} from "stores/entitiesStore";
import {useRouter} from "vue-router";
import {useUiStore} from "stores/uiStore";

const $q = useQuasar()
const tabsStore = useTabsStore()
const router = useRouter()
const uiStore = useUiStore()

const collections = ref<Map<string, Collection>>(new Map())
const entityType = ref()

watchEffect(() => {
  const entitiesStore = useEntitiesStore()
  console.log("uiStore.entityType", uiStore.entityType)
  if (uiStore.entityType) {
    const entityCollection: Map<string, Collection> = entitiesStore.collections.get(uiStore.entityType) || new Map()
    console.log("entityCollection", entityCollection)
    collections.value = entityCollection
  }
})

const openDialog = () => {
  $q.dialog({
    component: NewEntityCollectionDialog,
    componentProps: {
      type: uiStore.entityType,
      heading: 'Create a new '+uiStore.entityType+' Collection',
      tabsetId: tabsStore.currentTabsetId,
    }
  })
}

const openEntityCollection = (id: string) => {
  router.push(`/collections/${uiStore.entityType}/${id}`)
}
</script>
