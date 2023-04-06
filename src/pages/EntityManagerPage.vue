<template>
  <q-toolbar class="text-primary lightgrey" >
    <div class="row fit">
      <div class="col-xs-12 col-md-6">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">Entity  </span> <span
              class="text-primary text-weight-bold cursor-pointer">
              {{ entityType }}
            </span>



            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-6 text-right">

      </div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <q-card>
    <q-card-section>
      <vue-json-pretty style="font-size: 80%"
                       v-model:data="state.data"
                       :show-double-quotes="true"
      />
    </q-card-section>
  </q-card>

</template>

<script lang="ts" setup>

import {reactive, ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import {useUiStore} from "stores/uiStore";
import {useEntitiesService} from "src/services/EntitiesService";
import {useEntitiesStore} from "stores/entitiesStore";

const entityType = ref()

const route = useRoute()
const json = ref(null)

const state = reactive({
  val: JSON.stringify(json),
  data: json
})

watchEffect(() => {
  if (!route || !route.params) {
    return
  }

  entityType.value = route?.params.type?.toString().toUpperCase() as string
    if (entityType.value) {
      console.log("got entityType ", entityType.value)
      //useEntitiesService().selectCollection(collectionType.value, collectionId.value)
      const entityDef = useEntitiesStore().entityDefinitions.get(entityType.value)
      console.log("got def", entityDef)
      if (entityDef) {
        json.value = JSON.parse(JSON.stringify(entityDef))
      }
    }

})

watchEffect(() => {
  if (useUiStore().getSelectedTab) {

  }
})
</script>
