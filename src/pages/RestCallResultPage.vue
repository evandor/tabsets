<template>
  <q-splitter v-model="splitterModel" style="height: 100%">
    <template v-slot:before>
      <q-tabs v-model="requestTab" inline-label align="left">
        <!--          <q-tab name="response" label="Response" />-->
        <q-tab name="requestParams" label="Request Params" />
        <q-tab name="request" label="Request" />
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
                    <q-icon name="help" v-if="p['description' as keyof object]">
                      <q-tooltip class="tooltip-small">{{ p['description' as keyof object] }}</q-tooltip>
                    </q-icon>
                  </div>
                </div>
              </div>
              <div class="text-right cursor-pointer">
                <q-btn type="submit" label="call api" @click="callApi()" />
              </div>
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="request">
          <div class="q-mb-md">{{ restUrl }}</div>
        </q-tab-panel>
      </q-tab-panels>
    </template>

    <template v-slot:after>
      <div class="q-pa-none q-ma-none">
        <q-tabs v-model="responseTab" inline-label align="left">
          <!--          <q-tab name="response" label="Response" />-->
          <q-tab name="response" label="Response" />
          <q-tab name="schema" label="Structure" />
          <q-tab name="representation" label="representation" />
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
              <vue-json-pretty :show-length="true" :deep="2" v-model:data="state.data" :show-double-quotes="true" />
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
              <json-representation :schema="schema" :payload="payload" />
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </template>
  </q-splitter>

  <!--  <pre>{{ restTab?.params }}</pre>-->
</template>

<script lang="ts" setup>
import { RestParam, RestTab } from 'src/rest/models/RestTab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, reactive, ref, watchEffect } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import { useRoute } from 'vue-router'
import 'vue-json-pretty/lib/styles.css'
import JsonRepresentation from 'pages/widgets/JsonRepresentation.vue'
import toJsonSchema from 'to-json-schema'

const route = useRoute()

// const api = ref(route.params.api)
const payload = ref<object | undefined>(undefined)
const schema = ref<toJsonSchema.JSONSchema3or4 | undefined>(undefined)
const tabId = ref('')
const requestTab = ref('requestParams')
const responseTab = ref('response')
const splitterModel = ref(33)
const restTab = ref<RestTab | undefined>(undefined)
const searchIndexAsJson = ref(null)
const schemaAsJson = ref(null)

const restUrl = ref('')

const loading = ref(false)

const state = reactive({
  val: JSON.stringify(searchIndexAsJson),
  data: searchIndexAsJson,
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
    restTab.value = tAndTs!.tab as RestTab
    restTab.value.params.forEach((p: any) => {
      if (p.value && !p.val) {
        p.val = p.value
      }
    })
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

    searchIndexAsJson.value = JSON.parse(JSON.stringify(json))

    schema.value = toJsonSchema(json)
    console.log('schema', schema.value)
    schemaAsJson.value = JSON.parse(JSON.stringify(schema.value))

    loading.value = false
  }
}
</script>
