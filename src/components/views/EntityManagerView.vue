<template>
  <q-btn @click="openDialog" label="create new collection" size="12px"/>

  {{ entityDefinitions }}
  <ul v-for="def in [...entityDefinitions.values()]">
    <li @click="openEntityCollection(def.type)">{{ def.name }}</li>
  </ul>
</template>

<script lang="ts" setup>

import {useQuasar} from "quasar";
import {useTabsStore} from "stores/tabsStore";
import NewEntityDialog from "components/dialogues/NewEntityDialog.vue";
import {reactive, ref, watchEffect} from "vue";
import {useEntitiesStore} from "stores/entitiesStore";
import {useRouter} from "vue-router";
import {EntityDefinition} from "src/models/EntityDefinition";

const $q = useQuasar()
const tabsStore = useTabsStore()
const router = useRouter()

const entityDefinitions = ref<Map<string, EntityDefinition>>(new Map())


watchEffect(() => {
  const entitiesStore = useEntitiesStore()
  const defs = entitiesStore.entityDefinitions
  console.log("todos", entityDefinitions)
  entityDefinitions.value = defs
})

const openDialog = () => {
  $q.dialog({
    component: NewEntityDialog,
    componentProps: {
      type: 'NOTES',
      heading: 'Create a new Note Collection',
      tabsetId: tabsStore.currentTabsetId,
    }
  })
}

const openEntityCollection = (type: string) => {
  router.push(`/entityManager/${type.toLowerCase()}`)
}
</script>
