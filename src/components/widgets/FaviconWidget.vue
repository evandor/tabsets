<template>
    <q-img
           class="rounded-borders"
           style="cursor: move"
           :width="props.width"
           :height="props.height"
           :src="getFaviconUrl()">
      <q-tooltip>drag and drop to tabset</q-tooltip>
    </q-img>

</template>

<script lang="ts" setup>

import {useSettingsStore} from "src/stores/settingsStore"

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  favicon: {
    type: String,
    required: false
  },
  width: {
    type: String,
    default: '22px'
  },
  height: {
    type: String,
    default: '22px'
  },
  tooltip: {
    type: String,
    required: false
  }
})

const getFaviconUrl = () => {
  if (props.favicon && !props.favicon.startsWith("chrome")) {
    return props.favicon
  }
  if (!useSettingsStore().isEnabled('noDDG')) {
    let theUrl = props.url
    let theRealUrl
    try {
      theRealUrl = new URL(theUrl)
    } catch (err) {
      if (!theUrl.startsWith('http')) {
        theUrl = 'https://' + theUrl
        try {
          theRealUrl = new URL(theUrl)
        } catch (err) {
        }
      }
    }
    return theRealUrl ? "https://icons.duckduckgo.com/ip3/" + theRealUrl.hostname + ".ico" : 'favicon-unknown-32x32.png'
  }
  return 'favicon-unknown-32x32.png'
}

</script>
