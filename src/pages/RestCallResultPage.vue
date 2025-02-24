<template>
  <q-splitter v-model="splitterModel" style="height: 100%">
    <template v-slot:before>
      <q-tabs v-model="requestTab" inline-label align="left">
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
          <rest-call-request-params-panel :restTab="restTab" @call-api="callApi()" />
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
          <q-tab name="schemaRepresentation" label="Layout" v-if="payloadAsJson" />
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
              <div class="row">
                <div class="col-6 text-body1">Original</div>
                <div class="col-6 text-body1">Layouted</div>
                <div class="col-6">
                  <vue-json-pretty
                    :show-length="true"
                    :deep="2"
                    v-model:data="jsonSchema.data"
                    :show-double-quotes="true" />
                </div>
                <div class="col-6">
                  <!--                  <vue-json-pretty-->
                  <!--                    :show-length="true"-->
                  <!--                    :deep="2"-->
                  <!--                    v-model:data="restTab!.layout"-->
                  <!--                    :show-double-quotes="true" />-->
                </div>
              </div>
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
              <div class="text-right">
                <q-btn name="clear" label="clear layout" @click="clearLayout()" />
              </div>
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
import { RestParam, RestTab } from 'src/rest/models/RestTab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, reactive, ref, watchEffect } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import { useRoute } from 'vue-router'
import 'vue-json-pretty/lib/styles.css'
import { useQuasar } from 'quasar'
import { useNavigationService } from 'src/core/services/NavigationService'
import JsonRepresentation from 'src/pages/widgets/JsonRepresentation.vue'
import JsonSchemaRepresentation from 'src/pages/widgets/JsonSchemaRepresentation.vue'
import RestCallRequestParamsPanel from 'src/pages/widgets/RestCallRequestParamsPanel.vue'
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
const restUrl = ref('')

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
    //console.log('tabId', tabId.value, useTabsetsStore().loaded)
    const tAndTs = useTabsetsStore().getTabAndTabsetId(tabId.value)
    //console.log('tAndTs', tAndTs)
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
    // console.log('resturl', restUrl)
  }
})

const callApi = async () => {
  if (restTab.value) {
    loading.value = true
    //  console.log('params', restTab.value.params)
    const domain = restTab.value.params.find((p: RestParam) => p.name === 'domain')!
    //    console.log('domain', domain)

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
    if (restTab.value.layout && Object.keys(restTab.value.layout).length > 0) {
      console.log('starting with layout...', restTab.value.layout)
      return restTab.value.layout
    } else {
      console.log('starting with schema', toJsonSchema(payload.value))
      return toJsonSchema(payload.value)
    }
    // return toJsonSchema(payload.value)
  }
  return {}
}
const clearLayout = () => {
  if (restTab.value) {
    restTab.value.layout = {}
    save()
  }
}
</script>
