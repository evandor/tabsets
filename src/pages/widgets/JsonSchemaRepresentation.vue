<template>
  <div v-if="schema['type' as keyof object] === 'object'">
    <div v-for="(e, index) in Object.keys(schema['properties' as keyof object] || {})">
      <!--      <div class="text-h6">{{ e }} ({{ schema.properties[e as keyof object] }})</div>-->
      <div class="row">
        <div class="col-2 text-body1 ellipsis text-capitalize">
          {{ e }} {{ index }} {{ Object.keys(schema['properties' as keyof object] || {}).length - 1 }}
          <q-btn
            icon="south"
            flat
            size="xs"
            :disable="index === Object.keys(schema['properties' as keyof object] || {}).length - 1"
            class="cursor-pointer"
            @click="indexUpFor(index)" />
          <q-icon name="north" />
        </div>
        <div class="col text-body2">
          1*
          <json-schema-representation
            :identifier="e"
            :schema="schema['properties' as keyof object][e]"
            :payload="props.payload"
            @layout-changed="(i: any) => updateLayout(i)" />
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="schema['type' as keyof object] === 'string'">
    <div class="col-12 text-caption ellipsis text-capitalize">
      Type: String, Example: {{ props.identifier ? payload[props.identifier as keyof object] : '-' }}
    </div>
  </div>
  <div v-else-if="schema['type' as keyof object] === 'integer'">
    <div class="col-12 text-caption ellipsis text-capitalize">
      Type: Integer, Example: {{ props.identifier ? payload[props.identifier as keyof object] : '-' }}
    </div>
  </div>
  <div v-else-if="schema['type' as keyof object] === 'number'">
    <div class="col-12 text-caption ellipsis text-capitalize">
      Type: Number, Example: {{ props.identifier ? payload[props.identifier as keyof object] : '-' }}
    </div>
  </div>
  <div v-else-if="schema['type' as keyof object] === 'boolean'">
    <div class="col-12 text-caption ellipsis text-capitalize">
      Type: Boolean, Example: {{ props.identifier ? payload[props.identifier as keyof object] : '-' }}
    </div>
  </div>
  <div v-else-if="schema['type' as keyof object] === 'array'">
    <div class="col-12 text-caption ellipsis text-capitalize">
      <div class="row">
        <div class="col-2">Array</div>
        <div class="col-3">Rows Per Page</div>
        <div class="col">
          <q-select
            dense
            size="xs"
            v-model="schema['rowsPerPage' as keyof object]"
            :options="[
              { label: '5', value: 5 },
              { label: '10', value: 10 },
              { label: 'all', value: 0 },
            ]"
            @update:model-value="(val: any) => updatedSchema(val)" />
        </div>
      </div>
      <hr />
      **
      <json-schema-representation
        :schema="schema['items' as keyof object]"
        :payload="props.payload['data' as keyof object][0]"
        @layout-changed="(i: any) => updateLayout(i)" />
    </div>
  </div>
  <div v-else>
    <pre>schema: {{ schema }}</pre>
  </div>
</template>
<script lang="ts" setup>
const props = defineProps<{
  schema: object
  payload: object
  identifier?: string
}>()

const emits = defineEmits(['layoutChanged'])

const updatedSchema = (val: any) => {
  console.log('emiting...', val, JSON.stringify(props.schema))
  emits('layoutChanged', { schema: props.schema })
}

const updateLayout = (a: { jsonPath: string; schema: object }) => {
  //console.log('a', a.jsonPath, JSON.stringify(a.schema))
  console.log('***', JSON.stringify(props.schema))
  emits('layoutChanged', { schema: props.schema })
}

const indexUpFor = (i: number) => {
  console.log('indexupFor', i, props.schema)
  var keys = Object.keys(props.schema['properties' as keyof object])
  console.log('keys', keys)
}
</script>
