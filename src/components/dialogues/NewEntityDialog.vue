<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{ props.heading }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none" v-for="field in fields">
        <div class="text-body">{{ field.ident }}</div>
        <q-input v-model="entity[field.ident]"
                 class="q-mb-md q-pb-none"
                 dense autofocus
                 error-message="Please do not use special Characters, maximum length is 32"/>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" @click="onDialogCancel"/>
        <q-btn flat
               data-testid="newCollectionNameSubmit"
               label="Create new Collection"
               @click="createEntity()"/>
      </q-card-actions>

      <q-card-section class="q-pt-none">
        {{ entity }}
      </q-card-section>


    </q-card>
  </q-dialog>

</template>

<script lang="ts" setup>

import {computed, ref, watchEffect} from "vue";
import {useDialogPluginComponent, useQuasar} from "quasar";
import {useRoute, useRouter} from "vue-router";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useEntitiesStore} from "stores/entitiesStore";
import {Field} from "src/models/EntityDefinition";
import {CreateEntityCommand} from "src/domain/entities/CreateEntity";
import {forEach} from "lodash";

defineEmits([
  ...useDialogPluginComponent.emits
])

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  heading: {
    type: String,
    required: true
  }
})

const {dialogRef, onDialogHide, onDialogCancel} = useDialogPluginComponent()

const entitiesStore = useEntitiesStore()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const fields = ref<Field[]>([])
const hideWarning = ref(false)
const entity = ref<any>({})
const collectionId = ref<string | undefined>(undefined)

watchEffect(() => {
  console.log("props.type", props.type)
  const definition = entitiesStore.entityDefinitions?.get(props.type)
  console.log("definition", definition)
  if (definition) {
    fields.value = definition.fields
    forEach(fields.value, f => {
      if (f.value && entity.value) {
        entity.value[f.ident as keyof object] = f.value
        // entity.value['test' as keyof object] = ""
      }
    })
  }
})

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  collectionId.value = route?.params.collectionId as string
})

const createEntity = () => {
  if (collectionId.value) {
    hideWarning.value = true
    useCommandExecutor()
      .executeFromUi(new CreateEntityCommand(props.type, collectionId.value, entity.value))
  }
}


</script>
