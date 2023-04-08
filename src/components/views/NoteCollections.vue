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

const $q = useQuasar()
const tabsStore = useTabsStore()
const router = useRouter()

const collections = ref<Map<string, Collection>>(new Map())

watchEffect(() => {
  const entitiesStore = useEntitiesStore()
  const todos: Map<string, Collection> = entitiesStore.collections.get("NOTES") || new Map()
  console.log("todos", todos)
  collections.value = todos
})

const openDialog = () => {
  $q.dialog({
    component: NewEntityCollectionDialog,
    componentProps: {
      type: 'NOTES',
      heading: 'Create a new Note Collection',
      tabsetId: tabsStore.currentTabsetId,
    }
  })
}

const openEntityCollection = (id: string) => {
  router.push("/collections/notes/" + id)
}
</script>
