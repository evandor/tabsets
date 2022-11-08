<template>
  <div v-for="t in _.filter(urls, u => u.length> 1000)">
    {{t.length}}: {{ t }}<br><br>
    {{encoded(t)}}<br><br>
  </div>
</template>

<script lang="ts" setup>

import {useRouter} from "vue-router";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useTabsStore} from "src/stores/tabsStore";
import {ref, watchEffect} from "vue"
import _ from "lodash"

const router = useRouter()
const featureToggles = useFeatureTogglesStore()
const tabsStore = useTabsStore()

if (!featureToggles.debugEnabled) {
  router.push("/")
}

const urls = ref<string[]>([])

watchEffect(() =>
  _.map([...tabsStore.tabsets.values()], ts => {
    _.forEach(ts.tabs, tab => {
      urls.value.push(tab?.chromeTab?.url || 'unknown')
    })
  })
)

const encoded = (t:string) => btoa(t)

</script>
