<template>

  <q-toolbar>
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10">Entity Management</div>
          <div class="col-2 text-right">
            <q-btn label="delete entity" @click="deleteEntity()" />
          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="q-ma-md">

    <div class="q-ma-md">

      <fieldset style="border:1px dotted grey; border-radius:5px">
        <legend>{{ entity?.name }}: Definition</legend>
        <div class="row q-my-md">
          <div class="col-3 items-center">Description</div>
          <div class="col-9">
            <q-input v-model="description" label="Description"/>
          </div>

          <div class="col-3">Source</div>
          <div class="col-9">
            <q-select v-model="source" :options="sourceOptions"/>
          </div>

          <div class="col-3 q-my-sm">JsonPath</div>
          <div class="col-9 q-my-sm">
            <q-input v-model="jsonPath" label="jsonPath"/>
          </div>

          <div class="col-3 q-my-sm"></div>
          <div class="col-9 q-my-sm">
            <q-btn label="Update / Submit" @click="saveEntity()"/>
          </div>

        </div>
      </fieldset>

      <br><br>

      <fieldset style="border:1px dotted grey; border-radius:5px">
        <legend>{{ entity?.name }}: Defined Fields</legend>

        <q-list class="q-my-md" bordered separator>
          <q-item clickable v-ripple v-for="(f,idx) in entity?.fields" :key="idx">
            <q-item-section>
              <q-item-label>{{ f.label }}</q-item-label>
              <q-item-label caption>{{ f.id }}</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ f.type }}</q-item-label>
            </q-item-section>
            <q-item-section>
              <q-item-label>
              <span class="q-mr-md text-right">
<!--                <q-checkbox v-model="showInList[idx]" @update:modelValue="(val) => updateShowInList(idx)"/>-->
                <q-radio v-model="labelField" :val="f.name" label=""/>
              </span>
                <span class="q-mr-md text-right">
                <q-icon name="edit" color="primary" @click="editField(f)"/>
              </span>
                <span class="q-mr-md text-right">
                <q-icon name="delete" color="negative" @click="deleteField(f)"/>
              </span>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </fieldset>

      <br><br>

      <fieldset style="border:1px dotted grey; border-radius:5px">

        <legend>{{ entity?.name }}: Add Field</legend>

        <div class="row q-my-md">
          <div class="col-3 q-my-sm">Type</div>
          <div class="col-9 q-my-sm">
            <q-select v-model="typeModel" :options="[
                          {value: 'text',label: 'Text'},
                          {value: 'number',label: 'Number'},
                          {value: 'url',label: 'URL'},
                          {value: 'date',label: 'Date'},
                          {value: 'reference',label: 'Reference'},
                          { value: 'vueform', label: 'VueForm Native'},
                          {value: 'formula',label: 'Formula'},
                          {value: 'substitute',label: 'Text Substitution'}
                        ]" emit-value map-options label="Type"/>
          </div>

          <template v-if="typeModel === 'reference'">
            <div class="col-3 q-my-sm">Reference</div>
            <div class="col-9 q-my-sm">
              <q-input v-model="name" label="Name"/>
            </div>
          </template>

          <div class="col-3 q-my-sm">Name</div>
          <div class="col-9 q-my-sm">
            <q-input v-model="name" label="Name"/>
          </div>
          <div class="col-3 q-my-sm">Label</div>
          <div class="col-9 q-my-sm">
            <q-input v-model="label" label="Label"/>
          </div>
          <div class="col-3 q-my-sm">Info</div>
          <div class="col-9 q-my-sm">
            <q-input v-model="info" label="Info"/>
          </div>
        </div>
      </fieldset>


<!--      <Vueform ref="form2" :endpoint="submit2">-->

<!--        <SelectElement name="type" :native="false" label="Type" :can-deselect="false" :can-clear="false"-->
<!--                       :default="'text'"-->
<!--                       :items="[-->
<!--                          {value: 'text',label: 'Text'},-->
<!--                          {value: 'number',label: 'Number'},-->
<!--                          {value: 'url',label: 'URL'},-->
<!--                          {value: 'date',label: 'Date'},-->
<!--                          {value: 'reference',label: 'Reference'},-->
<!--                          { value: 'vueform', label: 'VueForm Native'},-->
<!--                          {value: 'formula',label: 'Formula'},-->
<!--                          {value: 'substitute',label: 'Text Substitution'}-->
<!--                        ]"/>-->
<!--        <SelectElement name="reference" :native="false" label="Referenced Entity"-->
<!--                       :conditions="[['type','in',['reference']]]"-->
<!--                       :items="entitiesAsReference"/>-->
<!--        <TextareaElement name="vueform" label="Vueform"-->
<!--                         :conditions="[['type','in',['vueform']]]"/>-->
<!--        <TextElement name="formula" label="Formula" placeholder="e.g. {a} * {b}"-->
<!--                     :conditions="[['type','in',['formula']]]"/>-->
<!--        <TextElement name="substitution" label="Text Substitution" placeholder="{a} ({b})"-->
<!--                     :conditions="[['type','in',['substitute']]]"/>-->
<!--        <TextElement name="name" label="Name" placeholder="the internal name" :rules="['required']"/>-->
<!--        <TextElement name="label" label="Label" placeholder="The label shown in the UI" :rules="['required']"/>-->
<!--        <TextElement name="info" label="Info" placeholder=""/>-->

<!--        <HiddenElement name="id"/>-->

<!--        <ButtonElement name="submit" submits align="right">{{ submitButtonLabel }}</ButtonElement>-->

<!--      </Vueform>-->

    </div>
  </div>
</template>

<script lang="ts" setup>

import {onMounted, ref, watch, watchEffect} from "vue";
import Analytics from "src/utils/google-analytics";
import {useRoute} from "vue-router";
import {useEntitiesStore} from "stores/entitiesStore";
import {Entity, Field} from "src/models/Entity";
import _ from "lodash"
import {uid} from "quasar";
import {useUtils} from "src/services/Utils";
import {ListDetailLevel} from "stores/uiStore";
import {useApisStore} from "stores/apisStore";

const {sendMsg} = useUtils()
const route = useRoute()

const form = ref(null)
const form2 = ref(null)
const entityId = ref<string | undefined>(undefined)
const entity = ref<Entity | undefined>(undefined)
const entitiesAsReference = ref<object[]>([])
const labelField = ref<string | undefined>(undefined)
const submitButtonLabel = ref('Add')
const description = ref('')
const name = ref('')
const label = ref('')
const info = ref('')
const jsonPath = ref<string | undefined>('$')
const source = ref<string>('manual')

const sourceOptions = ref<object[]>([])

const typeModel = ref('Text')

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelEntitiesPage', document.location.href);
})

watch(() => labelField.value, async (currentValue, oldValue) => {
  console.log("changed labelField", currentValue, oldValue)
  if (entity.value) {
    entity.value.labelField = currentValue
    await useEntitiesStore().save(entity.value)
  }
})

watchEffect(() => {
  sourceOptions.value = [{label: 'Manual', value: 'manual'}]
  const apis = useApisStore().apis
  for (const a of apis) {
    for (const e of a.endpoints) {
      sourceOptions.value.push({
        label: a.name + " -> " + e.path,
        value: e.id
      })
    }
  }

})

watchEffect(async () => {
  entityId.value = route.params.entityId.toString() || ''
  if (entityId.value && useEntitiesStore().updated) {
    entity.value = await useEntitiesStore().findById(entityId.value)
    labelField.value = entity.value?.labelField
    description.value = entity.value?.description || ''
    jsonPath.value = entity.value?.jsonPath || ''
    source.value = entity.value?.source || 'manual'
    if (form && form.value && entity.value) {
      form.value.update({ // updates form data
        desc: entity.value.description,
        scheme: entity.value.schema
      })
    }
  }
})

watchEffect(() => {
  entitiesAsReference.value = _.map(useEntitiesStore().entities, (e: Entity) => {
    return {
      value: e.id,
      label: e.name
    }
  })
})

const submit = async (FormData: any, form$: any) => {
  const formData = FormData // FormData instance
  const data = form$.data // form data including conditional data
  const requestData = form$.requestData // form data excluding conditional data
  console.log('xxx', formData, data, requestData, entity.value)
  if (entity.value) {
    entity.value.description = data.desc
    entity.value.schema = data.scheme
    await useEntitiesStore().save(entity.value)
  }
}

const submit2 = async (FormData: any, form$: any) => {
  const formData = FormData // FormData instance
  const data = form$.data // form data including conditional data
  const requestData = form$.requestData // form data excluding conditional data
  console.log('yyy', formData, data, requestData, entity.value)
  if (entity.value) {
    if (!data.id) {
      data.id = uid()
    }
    entity.value.fields.push(data)
    sendMsg('entity-changed', entity.value)
    //await useEntitiesStore().save(entity.value)
  }
}

const editField = async (f: object) => {
  console.log("editing", f)
  if (form2 && form2.value) {
    form2.value.update(f)
    submitButtonLabel.value = 'Update'
  }
}

const deleteField = async (f: Field) => {
  console.log("deleting", f)
  if (entity.value) {
    entity.value.fields = _.filter(entity.value.fields, (field: Field) => field.id !== f.id)
    await useEntitiesStore().save(entity.value)
  }
}

const saveEntity = async () => {
  if (entity.value) {
    entity.value.description = description.value
    entity.value.source = "api|" + source.value['value' as keyof object]
    entity.value.jsonPath = jsonPath.value
    console.log("saving", entity.value, source.value)
    await useEntitiesStore().save(entity.value)
  }
}

const deleteEntity = () => {
  if (entity.value) {
    useEntitiesStore().deleteEntity(entity.value.id)
    sendMsg('reload-entities')
    window.close()
  }
}


</script>

<style>

legend {
  border: 1px solid grey;
  border-radius: 3px;
  padding: 2px 5px 2px 5px;
}

</style>
