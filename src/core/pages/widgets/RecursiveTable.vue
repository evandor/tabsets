<template>
  <div class="row" v-for="key in Object.keys(data)" :key="key">
    <div
      v-if="!asList"
      class="col-2 text-caption text-bold ellipsis"
      :class="isObject(data[key as keyof object]) ? 'q-mt-sm' : ''">
      {{ key }}
    </div>
    <div class="col text-caption">
      <span v-if="isArray(data[key as keyof object])"
        >{{ labelForArray(key) }} <q-icon size="xs" name="arrow_right" />

        <q-expansion-item
          dense
          :label="data[key as keyof object]['@type']"
          header-class="text-primary"
          hide-expand-icon>
          <RecursiveTable :data="data[key as keyof object]" :asList="true" />
        </q-expansion-item>
      </span>
      <span v-else-if="isObject(data[key as keyof object])">
        <q-expansion-item
          dense
          :label="data[key as keyof object]['@type']"
          header-class="text-primary"
          hide-expand-icon>
          <!--            <template v-slot:header>-->
          <!--              <span>{{ data[key as keyof object]['@type'] }}</span>-->
          <!--            </template>-->
          <RecursiveTable :data="data[key as keyof object]" />
        </q-expansion-item>
      </span>
      <span v-else>
        <span v-if="isLink(key)" class="text-blue-8 cursor-pointer" @click="openLink(data[key as keyof object])">
          {{ data[key as keyof object] }}
        </span>
        <span v-else>
          {{ data[key as keyof object] }}
        </span>
      </span>
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
