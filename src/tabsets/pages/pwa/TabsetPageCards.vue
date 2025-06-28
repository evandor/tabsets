<template>
  <!-- TabsetPageCards -->

  <InfoMessageWidget :probability="1" ident="tabsetpagecards_taggridinfo" class="q-ma-md">
    Click the image to move your tabs to your liking; right-click to (re-)create thumbnails and click on the URL to open
    the page.
  </InfoMessageWidget>

  <TabGrid2
    :key="randomKey2"
    @was-clicked="updateGrids()"
    coordinates-identifier="grid"
    :tabset="props.tabset"
    :tabsetFolder="props.tabsetFolder"
    :tabs="currentTabs()" />
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { uid } from 'quasar'
import TabGrid2 from 'src/tabsets/layouts/TabGrid2.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useUiStore } from 'src/ui/stores/uiStore'
import InfoMessageWidget from 'src/ui/widgets/InfoMessageWidget.vue'
import { PropType, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const highlightUrl = ref('')
const orderDesc = ref(false)
const tabsetId = ref(null as unknown as string)
const randomKey1 = ref<string>(uid())
const randomKey2 = ref<string>(uid())

const props = defineProps({
  tabset: { type: Object as PropType<Tabset>, required: true },
  tabsetFolder: { type: Object as PropType<Tabset>, required: true },
  simpleUi: { type: Boolean, default: false },
})

watchEffect(() => {
  if (!route || !route.query) {
    return
  }
  const highlight = route?.query['highlight'] as unknown as string
  if (highlight && highlight.length > 0) {
    try {
      // highlightUrl.value = atob(highlight)
      useUiStore().addHighlight(atob(highlight))
    } catch (e: any) {
      console.error('highlight error', e)
    }
  }
})

watchEffect(() => {
  const highlightUrls: string[] = useUiStore().getHighlightUrls
  if (highlightUrls.length > 0) {
    //console.log("found hightlight", highlightUrls)
    highlightUrl.value = highlightUrls[0]!
  } else {
    highlightUrl.value = ''
  }
})

watchEffect(() => {
  if (!route || !route.params) {
    return
  }
  tabsetId.value = route?.params.tabsetId as string
  if (tabsetId.value) {
    console.debug('got tabset id', tabsetId.value)
  }
})

function currentTabs(): Tab[] {
  //console.log("got", props.tabset.tabs)
  // const filter = useUiStore().tabsFilter
  // if (filter && filter.trim() !== '') {
  //   return _.orderBy(
  //     _.filter(props.tabsetFolder.tabs, (t: Tab) => {
  //       return (
  //         (t.url || '')?.indexOf(filter) >= 0 ||
  //         (t.title || '')?.indexOf(filter) >= 0 ||
  //         t.description.indexOf(filter) >= 0
  //       )
  //     }),
  //     getOrder(),
  //     [orderDesc.value ? 'desc' : 'asc'],
  //   )
  // }
  return _.orderBy(props.tabsetFolder.tabs, getOrder(), [orderDesc.value ? 'desc' : 'asc'])
}

function getOrder() {
  if (props.tabsetFolder) {
    switch (props.tabsetFolder?.sorting) {
      case 'alphabeticalUrl':
        return (t: Tab) => t.url?.replace('https://', '').replace('http://', '').toUpperCase()
      case 'alphabeticalTitle':
        return (t: Tab) => t.title?.toUpperCase()
      default:
        return (t: Tab) => 1
    }
  }
}

const updateGrids = () => {
  randomKey1.value = uid()
  randomKey2.value = uid()
}
</script>
