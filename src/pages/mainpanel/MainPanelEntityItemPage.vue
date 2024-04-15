<template>

  <q-toolbar>
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10">Entity Management</div>
          <div class="col-2 text-right">

          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="q-ma-md">

    <div class="q-ma-md">

      <fieldset style="border:1px dotted grey; border-radius:5px">
        <legend>{{ entity?.name }}: Add</legend>
        <div class="row q-my-md" v-for="f in fields">

          <template v-if="f.type === 'text'">
            <div class="col-3 items-center">{{ f.label }}</div>
            <div class="col-9">
              <q-input v-model="f.value" :label="f.label"/>
            </div>
          </template>
          <template v-else-if="f.type === 'number'">
            <div class="col-3 items-center">{{ f.label }}</div>
            <div class="col-9">
              <q-input v-model="f.value" :label="f.label"/>
            </div>
          </template>
          <template v-else>
            <div class="col-3 items-center">{{ f }}</div>
            <div class="col-9">
              <q-input v-model="description" label="Description"/>
            </div>
          </template>
        </div>
        <div class="row q-my-md">
          <div class="col-3 items-center"></div>
          <div class="col-9">
            <q-btn label="Load" @click="loadFromApi()"/>
          </div>
        </div>
      </fieldset>

      <br><br>

      <div class="q-ma-md">
        <div class="text-h6">MainPanelEntityItemPage</div>

        EntityID {{ entityId }}<br>
        ItemID {{ itemId }}
        <q-btn v-if="itemId" class="q-ml-md" size="xs" label="Delete" @click="deleteItem()"/>


        <!--        <Vueform ref="form" :schema="schema" :endpoint="submit" @change="formChange()"></Vueform>-->

      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import Analytics from "src/utils/google-analytics";
import {useRoute} from "vue-router";
import {useEntitiesStore} from "stores/entitiesStore";
import {Entity, Field} from "src/models/Entity";
import _ from "lodash"
import {uid} from "quasar";
import {useUtils} from "src/services/Utils";
import {create, all} from 'mathjs'
import {useCommandExecutor} from "src/services/CommandExecutor";
import {ExecuteApiCommand} from "src/domain/apis/ExecuteApiCommand";
import {useApisStore} from "stores/apisStore";
import {ApiResponse, Endpoint} from "src/models/Api";

const config = {}
const math = create(all, config)

const {sendMsg} = useUtils()

const route = useRoute()

const form = ref(null)
const entityId = ref<string | undefined>(undefined)
const itemId = ref<string | undefined>(undefined)
const entity = ref<Entity | undefined>(undefined)
const formdata = ref<object>({})
const schema = ref({})
const referencedItems = ref<Map<string, object>>(new Map())
const calculatedField = ref<Map<string, object>>(new Map())
const fields = ref<Field[]>([])
// @ts-ignore
import {JSONPath} from '../../../node_modules/jsonpath-plus/dist/index-browser-esm.js';
import {ExecutionResult} from "src/domain/ExecutionResult";
import en from "@vueform/vueform/locales/en";

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelEntitiesPage', document.location.href);
})

watchEffect(() => {
  if (useEntitiesStore().updated) {
    const entities = useEntitiesStore().entities
    console.log("got entities", entities)
    for (const entity of entities) {
      const items = entity.items
      const valueMap = _.map(items, i => {
        console.log("chcking", i)
        return {
          value: i.id,
          label: i[entity.labelField as keyof object] || i.name || i.id
        }
      })
      console.log("setting referencesItems", entity.id, valueMap)
      referencedItems.value.set(entity.id, valueMap)
    }
    console.log("refrenceItems", referencedItems.value)
  }
})

entityId.value = route.params.entityId.toString() || undefined
itemId.value = route.params.itemId?.toString() || undefined

watchEffect(async () => {
  if (entityId.value && useEntitiesStore().updated) {
    entity.value = await useEntitiesStore().findById(entityId.value)
    if (entity.value) {
      const item: object | undefined = itemId.value ? _.find(entity.value!.items, (i: object) => i['id' as keyof object] === itemId.value) : undefined
      console.log("hier", item)
      console.log("entity", entity.value)

      fields.value = entity.value.fields

      const scheme: object = {}
      for (const f of entity.value.fields) {
        switch (f.type) {
          case 'text':
            scheme[f.name] = {
              type: 'text',
              label: f.label,
              info: f.info,
              default: item ? item[f.name as keyof object] : ''
            }
            break
          case 'number':
            scheme[f.name] = {
              type: 'text',
              inputType: 'number',
              label: f.label,
              info: f.info,
              default: item ? item[f.name as keyof object] : undefined
            }
            break
          case 'date':
            scheme[f.name] = {
              type: 'date',
              label: f.label,
              info: f.info,
              default: item ? item[f.name as keyof object] : undefined
            }
            break
          case 'reference':
            scheme[f.name] = {
              type: 'select',
              native: false,
              label: f.label,
              items: referencedItems.value.get(f.reference),
              info: f.info,
              default: item ? item[f.name as keyof object] : undefined
            }
            break
          case 'url':
            scheme[f.name] = {
              type: 'text',
              inputType: 'url',
              label: f.label,
              info: f.info,
              default: item ? item[f.name as keyof object] : undefined
            }
            break
          case 'formula':
            calculatedField.value.set(f.id, calculate(entity.value, f))
            scheme[f.name] = {
              type: 'text',
              readonly: true,
              label: f.label,
              info: f.info,
              submit: false,
              default: calculatedField.value.get(f.id)
              //value: item ? item[f.name as keyof object] : undefined
            }
          case 'substitute':
            console.log("===>", f.id)
            calculatedField.value.set(f.id, substitute(entity.value, f.substitution))
            scheme[f.name] = {
              type: 'text',
              readonly: true,
              label: f.label,
              info: f.info,
              submit: false,
              description: f.substitution,
              default: f.substitution
              //value: item ? item[f.name as keyof object] : undefined
            }
            break
          default:
            console.log("unknown type", f.type)
        }

      }
      scheme.id = {
        type: 'hidden',
        default: item ? item['id' as keyof object] : undefined
      }
      scheme.submit = {
        type: "button",
        buttonLabel: itemId ? "Update" : "Submit",
        submits: true,
        align: "right"
      }

      //let schema = entity.value.schema.trim()//.substring(0,entity.value.schema.trim().length - 1)
      // schema = schema + ',
      //   submit:
      console.log("scheme", referencedItems.value, scheme)

      schema.value = scheme
    }

  }
})


const submit = async (FormData, form$) => {
  const formData = FormData // FormData instance
  const data = form$.data // form data including conditional data
  const requestData = form$.requestData // form data excluding conditional data
  // console.log('xxx2', data)
  // console.log('xxx3', requestData)
  // console.log('xxx4', entity.value)
  if (entity.value) {
    if (!data.id) {
      data.id = uid()
      entity.value.items.push(data)
    } else {
      _.remove(entity.value.items, {
        id: itemId.value
      });
      entity.value.items.push(data)
    }
    sendMsg('entity-changed', entity.value)
    //await useEntitiesStore().save(entity.value)
    window.close()
  }
}

const calculate = (e: Entity, formula: object) => {
  console.log("e,formula", e, formula)
  let rawFormula: string = formula.formula || ''
  for (const field of e.fields) {
    if (field.type === "number") {
      //console.log("field", field)
      //console.log("formdata", formdata.value)
      const fieldName = field.name
      rawFormula = rawFormula.replaceAll("{" + fieldName + "}", formdata.value[fieldName as keyof object])
      // console.log("rawFormula", rawFormula)
    }
  }
  try {
    return math.evaluate(rawFormula)
  } catch (err) {
    console.log("error", err)
    return formula.formula
  }
}

const substitute = (e: Entity, substitution: string) => {
  console.log("e,substitution", substitution)
  let sub: string = substitution || ''
  let match = false
  for (const field of e.fields) {

    const fieldName = field.name
    switch (field.type) {
      case "reference":
        console.log("field", field)
        console.log("formdata", formdata.value)
        console.log("xxx", field.reference, referencedItems.value)
        console.log("xxx", referencedItems.value.get(field.reference)[0])
        match = true
        sub = sub.replaceAll("{" + fieldName + "}", referencedItems.value.get(field.reference)[0].label)
        break
      default:
        if (formdata.value[fieldName as keyof object]) {
          match = true
          sub = sub.replaceAll("{" + fieldName + "}", formdata.value[fieldName as keyof object])
        }
    }
    console.log("sub", sub)
  }
  // try {
  //   return math.evaluate(rawFormula)
  // } catch (err) {
  //   console.log("error", err)
  //   return formula.formula
  // }
  return match ? sub : substitution.substitution
}

const deleteItem = () => {
  if (entity.value) {
    console.log("deleting item id", itemId.value)
    _.remove(entity.value.items, {
      id: itemId.value
    });
    //entity.value.items = removed
    console.log("got", entity.value)
    sendMsg('entity-changed', entity.value)
    window.close()
  }
}

const loadFromApi = async () => {
  console.log("loading from api", entity.value)
  if (entity.value?.source?.startsWith("api|")) {
    const apiId = entity.value.source.split("|")[1]
    const endpointId = entity.value.source.split("|")[2]
    const api = await useApisStore().findById(apiId)
    if (api) {
      const endpoint = _.find(api.endpoints, {id: endpointId}) || new Endpoint("","", [])
      const res: ExecutionResult<ApiResponse> = await useCommandExecutor().executeFromUi(new ExecuteApiCommand(api, endpoint))
      console.log("res", res)
      let data = res.result.data
      if (entity.value.jsonPath) {
        data = JSONPath({path: entity.value.jsonPath, json: data});
      }
      console.log("data", typeof data, data)
      const fromResult = data[0]
      console.log("fromResult", fromResult)
      for (const [key, value] of Object.entries(fromResult)) {
        // console.log(`${key}: ${value}`);
        for (const f of fields.value) {
          if (f.name === key) {
            console.log("setting ", key, value)
            f.value = value
          }
        }
      }
    }
  }
}

</script>


