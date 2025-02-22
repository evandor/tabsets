<template>
  <div v-if="schema['type' as keyof object] === 'object'">
    <div v-for="(e, index) in propertyKeys()">
      <!--      <div class="text-h6">{{ e }} ({{ schema.properties[e as keyof object] }})</div>-->
      <div class="row">
        <div class="col-2 text-body1 ellipsis text-capitalize">
          <q-btn
            icon="south"
            flat
            dense
            size="xs"
            :disable="index === propertyKeys().length - 1"
            class="cursor-pointer q-mx-none"
            @click="indexUpdate(index, propertyKeys().length, true)" />
          <q-btn
            icon="north"
            flat
            dense
            size="xs"
            :disable="index === 0"
            class="cursor-pointer q-mx-none"
            @click="indexUpdate(index, propertyKeys().length, false)" />
          <q-btn
            :icon="isVisible(index) ? 'disabled_visible' : 'sym_o_visibility'"
            flat
            dense
            size="xs"
            class="cursor-pointer q-mx-none"
            @click="toggleHide(index)" />
          <span class="q-ml-sm">{{ e }}</span>
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

const isVisible = (i: number) => {
  const keys = Object.keys(props.schema['properties' as keyof object])
  const value = props.schema['properties' as keyof object][keys[i] as keyof object]
  return !value['hide' as keyof object]
}

const toggleHide = (i: number) => {
  var keys = Object.keys(props.schema['properties' as keyof object])
  console.log('keys', i, keys)
  let value = props.schema['properties' as keyof object][keys[i] as keyof object]
  console.log('value', value)
  if (value['hide' as keyof object]) {
    value = Object.assign(value, { hide: false })
  } else {
    value = Object.assign(value, { hide: true })
  }
  props.schema['properties' as keyof object][keys[i] as keyof object] = Object.assign(
    props.schema['properties' as keyof object][keys[i] as keyof object],
    value,
  )
  console.log('result', props.schema)
}

const indexUpdate = (i: number, length: number, up: boolean) => {
  // console.log('indexupFor', i, props.schema)
  var keys = Object.keys(props.schema['properties' as keyof object])
  console.log('keys', keys)
  if (up && i + 1 < length) {
    const valAtIndex = keys[i]
    const valAtNextIndex = keys[i + 1]
    keys[i] = valAtNextIndex!
    keys[i + 1] = valAtIndex!
  } else if (i > 0) {
    const valAtIndex = keys[i]
    const valAtIndexBefore = keys[i - 1]
    keys[i] = valAtIndexBefore!
    keys[i - 1] = valAtIndex!
  }
  let o: { [k: string]: any } = {}
  Array.from(keys).forEach((k: string) => {
    o[k as keyof object] = null
  })
  props.schema['properties' as keyof object] = Object.assign(o, props.schema['properties' as keyof object])
  // console.log('result', props.schema)
}

const propertyKeys = () => Object.keys(props.schema['properties' as keyof object] || {})
</script>
