<template>
  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-7">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-12">
              <span class="text-primary"> <q-icon name="article" /> Reading Mode </span>
            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-5 text-right">
        <!--        <q-btn-->
        <!--          flat dense icon="block"-->
        <!--          color="primary"-->
        <!--          :label="$q.screen.gt.md ? 'Never open in Reading Mode' : 'Avoid Reading Mode'"-->
        <!--          class="q-mr-sm"-->
        <!--          @click="NavigationService.openOrCreateTab([tab?.tabReferences.filter(r => r.type === TabReferenceType.ORIGINAL_URL)[0].href || ''])">-->
        <!--          <q-tooltip>Open Original Page</q-tooltip>-->
        <!--        </q-btn>-->

        <q-btn
          flat
          dense
          icon="open_in_new"
          color="primary"
          :label="$q.screen.gt.md ? 'Open Original Page' : 'Original'"
          class="q-mr-sm">
          <!--          @click="NavigationService.openOrCreateTab([tab?.tabReferences.filter(r => r.type === TabReferenceType.ORIGINAL_URL)[0].href || ''])">-->
          <q-tooltip>Open Original Page</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-toolbar>

  <div class="row justify-center items-center" style="max-width: 600px; margin-left: auto; margin-right: auto">
    <div class="col-12 text-h5 q-ma-lg q-pa-sm">
      {{ title }}
    </div>
    <div class="col-12 text-h6 q-mx-lg q-pa-sm">
      {{ excerpt }}
    </div>
    <div class="col-12 text-caption q-mx-lg q-pa-sm">
      {{ siteName }}
    </div>
    <div class="col-12 text-caption q-mx-lg q-pa-sm">
      {{ byline }}
    </div>
    <div class="col-12 q-mx-lg q-pa-sm" v-html="content"></div>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import NavigationService from 'src/services/NavigationService'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { sanitizeAsText } = useUtils()

const $q = useQuasar()
const route = useRoute()

const tabId = route.params.tabId as string

//const tab = ref(useTabsStore().getTab(tabId))
const tab = ref<Tab>()
const title = ref('')
const excerpt = ref('')
const content = ref('')
const byline = ref('')
const siteName = ref('')

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelReadingModePage', document.location.href)
})

watchEffect(async () => {
  const res = useTabsetsStore().getTabAndTabsetId(tabId)
  if (res && res.tab) {
    tab.value = res.tab
    const tabRefs: TabReference[] = res.tab.tabReferences.filter((r) => r.type === TabReferenceType.READING_MODE)
    if (tabRefs.length > 0) {
      const article = tabRefs[0]!.data[0]
      // const response = await fetch(tab.value.url || '')
      // const s = await response.text()
      // const parser = new DOMParser();
      // const doc = parser.parseFromString(s, "text/html");
      // const article = new Readability(doc).parse() || {};

      if (article) {
        title.value = sanitizeAsText(article['title' as keyof object])
        excerpt.value = sanitizeAsText(article['excerpt' as keyof object])
        content.value = sanitizeAsText(article['content' as keyof object])
        byline.value = sanitizeAsText(article['byline' as keyof object])
        siteName.value = sanitizeAsText(article['siteName' as keyof object])
      }
    }
  }
})
</script>
