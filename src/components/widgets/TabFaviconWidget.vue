<template>
  <div class="col-2">
    <q-icon v-if="UrlExtension.IMAGE === tab?.extension"
            :size="props.width"
            name="image" />
    <q-icon v-else-if="UrlExtension.RSS === tab?.extension"
            size="22px"
            name="rss_feed" />
    <q-icon v-else-if="UrlExtension.PDF === tab?.extension"
            size="22px"
            name="pdf" />
    <q-img v-else
           class="rounded-borders"
           style="cursor: move"
           :width="props.width"
           :height="props.height"
           :src="getFaviconUrl(tab)">
      <q-tooltip>drag and drop to tabset</q-tooltip>
    </q-img>
  </div>


</template>

<script lang="ts" setup>

import {Tab, UrlExtension} from "src/models/Tab";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";

const props = defineProps({
  tab: {
    type: Object,
    required: true
  },
  width: {
    type: String,
    default: '22px'
  },
  height: {
    type: String,
    default: '22px'
  }
})

const getFaviconUrl = (tab: Tab) => {
  const chromeTab = tab?.chromeTab
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    return chromeTab.favIconUrl
  }
  if (!useFeatureTogglesStore().isEnabled('noDDG') && tab && tab.chromeTab) {
    let theUrl = tab.chromeTab.url || ''
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
