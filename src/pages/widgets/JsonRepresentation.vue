<template>
  <div v-if="schema && schema.type === 'object' && schema.properties">
    <div v-for="e in Object.keys(schema.properties || {})">
      <!--      <div class="text-h6">{{ e }} ({{ schema.properties[e as keyof object] }})</div>-->
      <div class="row">
        <template v-if="typeMatch(e, ['string', 'number', 'integer'])">
          <div class="col-2 text-caption ellipsis text-capitalize">{{ e }}</div>
          <div class="col text-body2">
            <span
              v-if="typeMatch(e, ['string']) && isImage(e, payload![e as keyof object])"
              class="cursor-pointer text-blue-8"
              @click="useNavigationService().browserTabFor(payload![e as keyof object])">
              <img :src="payload![e as keyof object]" />
            </span>
            <span
              v-else-if="typeMatch(e, ['string']) && isUrl(payload![e as keyof object])"
              class="cursor-pointer text-blue-8"
              @click="useNavigationService().browserTabFor(payload![e as keyof object])">
              {{ payload![e as keyof object] }}
            </span>
            <span v-else-if="typeMatch(e, ['string'])"> {{ payload![e as keyof object] }} </span>
            <span v-else>
              {{ payload![e as keyof object] }}
            </span>
          </div>
        </template>
        <template v-if="typeMatch(e, ['array']) && hasData(payload[e as keyof object])">
          <div class="col-12 q-mt-md">
            <div>{{ e }}</div>
            <json-representation :payload="payload[e as keyof object]" />
          </div>
        </template>
        <template v-if="typeMatch(e, ['object'])">
          <div class="col-12 q-mt-md">
            <div class="text-body1">{{ e }}</div>
            <json-representation :payload="payload[e as keyof object]" />
          </div>
        </template>
        <!--        <div v-else>e*: {{ e }}</div>-->
      </div>
    </div>
  </div>
  <div v-else-if="schema && schema.type === 'array'">
    <q-table :rows="props.payload as any[]" :columns="columns()" row-key="name" dense flat>
      <template v-slot:body-cell="props">
        <q-td
          :props="props"
          v-if="isUrl(props.value)"
          class="cursor-pointer text-blue-8"
          @click="useNavigationService().browserTabFor(props.value)">
          {{ props.value }}
        </q-td>
        <q-td :props="props" v-else-if="typeof props.value === 'object' && JSON.stringify(props.value).startsWith('{')">
          <json-representation :payload="props.value" />
        </q-td>
        <q-td v-else :props="props"> {{ props.value }}</q-td>
      </template>
    </q-table>
  </div>
  <div v-else>---{{ schema }} {{ payload }}</div>
</template>
<script lang="ts" setup>
import { useNavigationService } from 'src/core/services/NavigationService'
import toJsonSchema from 'to-json-schema'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  payload: object
}>()

const schema = ref<toJsonSchema.JSONSchema3or4 | undefined>(undefined)

onMounted(() => {
  schema.value = toJsonSchema(props.payload)
})

const typeMatch = (e: string, matches: string[]) =>
  matches.find((m: string) => schema.value!.properties![e as keyof object]!['type' as keyof object] === m)

const columns = () => {
  const fields: Set<string> = new Set()
  if (props.payload && Array.isArray(props.payload)) {
    for (const l of props.payload as object[]) {
      // console.log('l', Object.keys(l))
      Object.keys(l).forEach((k) => fields.add(k))
    }
  }
  return Array.from(fields.keys()).map((f: string) => {
    return {
      name: f,
      align: 'left',
      label: f,
      field: f,
      format: (val: any, row: any) => restrictLength(val, row, Array.from(fields.keys()).length),
      sortable: true,
    } as { name: string; align: 'left' | 'center' | 'right'; label: string; field: any }
  })
}

const hasData = (e: any[]) => {
  return e.length > 0
}

const restrictLength = (val: any, row: any, fieldsCount: number) => {
  const avgLength = Math.max(20, Math.round(150 / fieldsCount))
  if (typeof val === 'string') {
    return val.length > avgLength ? val.substring(0, avgLength - 3) + '...' : val
  }
  return val
}
const isUrl = (s: any) => typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://'))

const isImage = (identifier: string, s: any) =>
  isUrl(s) && ['thumbnail', 'favicon'].find((m: string) => identifier.toLowerCase() === m)
</script>
