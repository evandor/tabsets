<template>
  <q-splitter v-model="splitterModel" style="height: 100%">
    <template v-slot:before>
      <q-tabs v-model="requestTab" inline-label align="left">
        <!--          <q-tab name="response" label="Response" />-->
        <q-tab name="requestParams" label="Request Params" />
        <q-tab name="request" label="Request" />
        <q-tab name="docs" label="Docs" />
      </q-tabs>

      <q-tab-panels
        v-model="requestTab"
        animated
        swipeable
        vertical
        transition-prev="jump-up"
        transition-next="jump-up">
        <q-tab-panel name="requestParams">
          <div class="q-mb-md">
            <div>
              <template v-if="Object.keys(restTab?.paramsTemplates || {}).length > 0">
                <div class="row">
                  <div class="col-11">
                    <q-select
                      label="Template"
                      v-model="selectedTemplate"
                      :options="Array.from(Object.keys(restTab?.paramsTemplates || {}))"
                      @update:model-value="(val: string) => updateTemplate(val)" />
                  </div>
                  <div class="col"></div>
                </div>
                <div class="col-12">
                  <hr />
                </div>
              </template>
              <div v-for="p in restTab?.params">
                <div class="row">
                  <div class="col-11">
                    <q-input
                      outlined
                      hide-hint
                      class="q-mt-md"
                      v-if="p['paramType' as keyof object] === 'STRING'"
                      type="text"
                      v-model="p['val' as keyof object]"
                      :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
                      :rules="
                        p['condition' as keyof object] === 'REQUIRED' ? [(val) => !!val || 'Field is required'] : []
                      " />
                    <q-input
                      outlined
                      class="q-mt-md"
                      v-else-if="p['paramType' as keyof object] === 'NUMBER'"
                      type="text"
                      v-model="p['val' as keyof object]"
                      :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
                      :rules="
                        p['condition' as keyof object] === 'REQUIRED' ? [(val) => !!val || 'Field is required'] : []
                      " />
                    <q-select
                      outlined
                      class="q-mb-md"
                      v-else-if="p['paramType' as keyof object] === 'BOOLEAN'"
                      :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
                      :options="['Do not include in request', 'true', 'false']"
                      v-model="p['val' as keyof object]" />
                    <q-input
                      outlined
                      v-else-if="p['paramType' as keyof object] === 'DATE (YYYY-MM-DD)'"
                      :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
                      :options="['Do not include in request', 'true', 'false']"
                      v-model="p['val' as keyof object]" />
                    <div v-else>
                      {{ p }}
                    </div>
                  </div>
                  <div class="col text-right q-mt-md">
                    <q-icon name="sym_o_help" v-if="p['description' as keyof object]">
                      <q-tooltip class="tooltip-small">{{ p['description' as keyof object] }}</q-tooltip>
                    </q-icon>
                  </div>
                </div>
              </div>
              <div class="text-right cursor-pointer">
                <div class="row">
                  <div class="col-12">
                    <hr />
                  </div>
                </div>
                <div class="row">
                  <div class="col-11">
                    <q-btn
                      size="sm"
                      label="delete template"
                      class="q-mr-sm"
                      @click="deleteTemplate()"
                      v-if="selectedTemplate" />
                    <q-btn size="sm" label="save template" class="q-mr-sm" @click="saveTemplate()" />
                    <q-btn size="sm" type="submit" label="call api" @click="callApi()" />
                  </div>
                  <div class="col"></div>
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="request">
          <div class="q-mb-md">{{ restUrl }}</div>
        </q-tab-panel>
        <q-tab-panel name="docs">
          <div
            class="q-mb-md cursor-pointer text-blue-8"
            v-if="getDocLink()"
            @click="useNavigationService().browserTabFor(getDocLink()!)">
            {{ getDocLink() }}
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </template>

    <template v-slot:after>
      <div class="q-pa-none q-ma-none">
        <q-tabs v-model="responseTab" inline-label align="left">
          <!--          <q-tab name="response" label="Response" />-->
          <q-tab name="response" label="Response" />
          <q-tab name="schema" label="Schema" v-if="payloadAsJson" />
          <q-tab name="representation" label="representation" v-if="payloadAsJson" />
          <q-tab name="schemaRepresentation" label="Scheme Representation" v-if="payloadAsJson" />
        </q-tabs>

        <q-tab-panels
          v-model="responseTab"
          animated
          swipeable
          vertical
          transition-prev="jump-up"
          transition-next="jump-up">
          <q-tab-panel name="response">
            <q-spinner v-if="loading" />
            <div v-else class="q-mb-md">
              <vue-json-pretty
                v-if="state.data"
                :show-length="true"
                :deep="2"
                v-model:data="state.data"
                :show-double-quotes="true" />
              <div v-else>no data yet</div>
            </div>
          </q-tab-panel>
          <q-tab-panel name="schema">
            <q-spinner v-if="loading" />
            <div v-else class="q-mb-md">
              <vue-json-pretty
                :show-length="true"
                :deep="2"
                v-model:data="jsonSchema.data"
                :show-double-quotes="true" />
            </div>
          </q-tab-panel>
          <q-tab-panel name="representation">
            <q-spinner v-if="loading" />
            <div v-else-if="payload && schema" class="q-mb-md">
              <json-representation :payload="payload" :layout="layout()" />
            </div>
          </q-tab-panel>
          <q-tab-panel name="schemaRepresentation">
            <q-spinner v-if="loading" />
            <div v-else class="q-mb-md">
              {{ schema }}
              <hr />
              <json-schema-representation
                :schema="layout()"
                :payload="payloadAsJson || {}"
                @layout-changed="(layout: any) => layoutChanged(layout)" />
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </template>
  </q-splitter>

  <!--  <pre>{{ restTab?.params }}</pre>-->
</template>

<script lang="ts" setup>
import { ParamTemplateKeyValue, RestParam, RestTab } from 'src/rest/models/RestTab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, reactive, ref, watchEffect } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import { useRoute } from 'vue-router'
import 'vue-json-pretty/lib/styles.css'
import JsonRepresentation from 'pages/widgets/JsonRepresentation.vue'
import JsonSchemaRepresentation from 'pages/widgets/JsonSchemaRepresentation.vue'
import { useQuasar } from 'quasar'
import { useNavigationService } from 'src/core/services/NavigationService'
import toJsonSchema from 'to-json-schema'
import { TabReference, TabReferenceType } from '../content/models/TabReference'

const $q = useQuasar()
const route = useRoute()

// const api = ref(route.params.api)
const payload = ref<object | undefined>(undefined)
const schema = ref<toJsonSchema.JSONSchema3or4 | undefined>(undefined)
const tabId = ref('')
const requestTab = ref('requestParams')
const responseTab = ref('response')
const splitterModel = ref(33)
const restTab = ref<RestTab | undefined>(undefined)
const payloadAsJson = ref(null)
const schemaAsJson = ref(null)
const selectedTemplate = ref<string | undefined>(undefined)

const restUrl = ref('')
const templateName = ref('')

const loading = ref(false)

const state = reactive({
  val: JSON.stringify(payloadAsJson),
  data: payloadAsJson,
})

const jsonSchema = reactive({
  val: JSON.stringify(schemaAsJson),
  data: schemaAsJson,
})

onMounted(async () => {
  console.log('route', route.path)
  tabId.value = route.params.api as string
})

watchEffect(async () => {
  if (useTabsetsStore().loaded) {
    console.log('tabId', tabId.value, useTabsetsStore().loaded)
    const tAndTs = useTabsetsStore().getTabAndTabsetId(tabId.value)
    console.log('tAndTs', tAndTs)
    if (tAndTs) {
      restTab.value = tAndTs!.tab as RestTab
      restTab.value.params.forEach((p: any) => {
        if (p.value && !p.val) {
          p.val = p.value
        }
      })
    }
  }
})

watchEffect(() => {
  if (restTab.value) {
    restUrl.value = `${restTab.value.host}${restTab.value.route}`.replaceAll('"', '') //.replace('{domain}', domain?.val)

    const queryString = restTab.value.params
      .filter((p: any) => p.querystring && p.val)
      .map((p: any) => p.name + '=' + p.val)
      .join('&')
    if (queryString) {
      restUrl.value += '?' + queryString
    }
    console.log('resturl', restUrl)
  }
})

const callApi = async () => {
  if (restTab.value) {
    loading.value = true
    console.log('params', restTab.value.params)
    const domain = restTab.value.params.find((p: RestParam) => p.name === 'domain')!
    console.log('domain', domain)

    const res = await fetch(restUrl.value, {
      headers: restTab.value.headers,
    })
    const json = await res.json()
    console.log('res', json)
    payload.value = json

    payloadAsJson.value = JSON.parse(JSON.stringify(json))

    schema.value = toJsonSchema(json)
    console.log('schema', schema.value)
    schemaAsJson.value = JSON.parse(JSON.stringify(schema.value))

    loading.value = false
  }
}

const getDocLink = () => {
  const t: TabReference[] | undefined = restTab.value?.tabReferences.filter(
    (tr: TabReference) => tr.type === TabReferenceType.DOCUMENTATION,
  )
  if (t && t.length > 0) {
    return t[0]?.href?.replaceAll('"', '')
  }
}

const saveTemplate = () => {
  $q.dialog({
    title: 'Save Request Params As Template',
    message: 'Provide a name for the template',
    prompt: { model: templateName.value, isValid: (val: string) => val.length > 2, type: 'text' },
    cancel: true,
    persistent: true,
  }).onOk((data: any) => {
    console.log('data', data)
    console.log('restTab', restTab.value?.params)
    const rt: RestTab = Object.assign(
      new RestTab('', 'title', 'https://skysail.io', 'OBSIDIAN', '', '', ''),
      restTab.value!,
    )

    //const rt: RestTab = new RestTab(JSON.parse(restTab.value!)))
    const keyValues: ParamTemplateKeyValue[] = []
    restTab.value!.params.forEach((p) => {
      keyValues.push([p.name, p.val])
    })
    rt.addParamsTemplate(data, keyValues)
    save()
    //restTab.value!.addParamsTemplate(data, restTab.value!.params)
  })
}

const updateTemplate = (val: string) => {
  console.log('val', val)
  if (restTab.value) {
    const selectedTemplate: ParamTemplateKeyValue[] | undefined = restTab.value.paramsTemplates[val]
    if (selectedTemplate) {
      restTab.value?.params.forEach((p: RestParam) => {
        const match = selectedTemplate.filter((kv) => kv[0] === p.name)
        if (match && match.length > 0) {
          p.val = match[0]![1]
        }
      })
    }
  }
}

const deleteTemplate = () => {
  if (restTab.value && selectedTemplate.value) {
    delete restTab.value.paramsTemplates[selectedTemplate.value]
  }
  save()
}

const layoutChanged = (a: { jsonPath: string; schema: object }) => {
  console.log('---', JSON.stringify(a.schema))
  // console.log('***', JSON.stringify(props.schema))
  restTab.value!.layout = a.schema
  save()
}

const save = () => {
  const ts = useTabsetsStore().getCurrentTabset
  useTabsetsStore().saveTabset(ts!)
}

const layout = () => {
  if (restTab.value) {
    if (restTab.value.layout) {
      console.log('starting with layout...', restTab.value.layout)
      return restTab.value.layout
    } else {
      console.log('starting with schema', toJsonSchema(payload.value))
      return toJsonSchema(payload.value)
    }
    //return toJsonSchema(payload.value)
  }
  return {}
}
</script>
