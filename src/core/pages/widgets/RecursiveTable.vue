<template>
  <div class="row" v-for="key in Object.keys(data)" :key="key">
    <div
      v-if="!asList"
      class="col-2 text-caption text-bold ellipsis"
      :class="isObject(data[key as keyof object]) ? 'q-mt-sm' : ''">
      {{ key }}
    </div>
    <div class="col text-caption">
      <template v-if="isArray(data[key as keyof object])">
        <q-expansion-item dense :label="labelForArray(key)" header-class="text-primary" hide-expand-icon>
          <RecursiveTable :data="data[key as keyof object]" :asList="true" />
        </q-expansion-item>
      </template>
      <template v-else-if="data[key as keyof object] === null">
        <div class="q-mt-sm">---</div>
      </template>
      <template v-else-if="isObject(data[key as keyof object])">
        <q-expansion-item
          dense
          :label="data[key as keyof object]['@type']"
          header-class="text-primary"
          hide-expand-icon>
          <RecursiveTable :data="data[key as keyof object]" />
        </q-expansion-item>
      </template>
      <template v-else>
        <span v-if="isLink(key)" class="text-blue-8 cursor-pointer" @click="openLink(data[key as keyof object])">
          {{ data[key as keyof object] }}
        </span>
        <span
          v-else-if="key === '@type'"
          class="text-blue-8 cursor-pointer"
          @click="openLink(data['@context' as keyof object] + '/' + data['@type' as keyof object])">
          {{ data[key as keyof object] }}
        </span>
        <span v-else>
          {{ data[key as keyof object] }}
        </span>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useNavigationService } from 'src/core/services/NavigationService'

type Props = { data: object; asList?: boolean }
const props = withDefaults(defineProps<Props>(), { asList: false })

const isObject = (val: any) => typeof val === 'object'
const isArray = (val: any) => Array.isArray(val)
const isLink = (key: any) => {
  const val = props.data[key as keyof object] as any
  return typeof val === 'string' && (val.trim().startsWith('http://') || val.trim().startsWith('https://'))
}
const labelForArray = (key: string) => {
  const arr = props.data[key as keyof object] as Array<any>
  return `array (${arr.length})`
}
const openLink = (url: string) => useNavigationService().browserTabFor(url)
</script>

<style>
.q-list--dense > .q-item,
.q-item--dense {
  padding: 2px 0 !important;
}
</style>
