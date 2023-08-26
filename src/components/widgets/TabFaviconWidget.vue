<template>
  <q-icon v-if="UrlExtension.IMAGE === tab?.extension"
          :size="props.width"
          name="image"/>
  <q-icon v-else-if="UrlExtension.RSS === tab?.extension"
          size="22px"
          name="rss_feed"/>
  <q-icon v-else-if="UrlExtension.PDF === tab?.extension"
          size="22px"
          name="pdf"/>
  <q-icon v-else-if="UrlExtension.NOTE === tab?.extension"
          size="22px"
          name="o_note"/>
  <q-img v-else
         class="rounded-borders"
         style="cursor: move"
         :width="props.width"
         :height="props.height"
         :src="getFaviconUrl(tab as Tab)">
    <q-tooltip v-if="!props.preventDragAndDrop">drag and drop to tabset</q-tooltip>
    <q-tooltip v-else>This is a sorted list, you cannot drag and drop</q-tooltip>
  </q-img>


</template>

<script lang="ts" setup>

import {Tab, UrlExtension} from "src/models/Tab";
import {useSettingsStore} from "src/stores/settingsStore"

const props = defineProps({
  tab: {type: Object, required: true},
  width: {type: String, default: '22px'},
  height: {type: String, default: '22px'},
  preventDragAndDrop: {type: Boolean, default: false},
})

const getFaviconUrl = (tab: Tab) => {
  //const chromeTab = tab?.chromeTab
  if (tab && tab.url?.startsWith("chrome")) {
    return 'favicon-unknown-32x32.png'
  }
  if (tab && tab.favIconUrl) {
    return tab.favIconUrl
  }
  if (!useSettingsStore().isEnabled('noDDG') && tab) {
    let theUrl = tab.url || ''
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
