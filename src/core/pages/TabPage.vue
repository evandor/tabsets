<template>
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">Tab Info for '{{ selectedTab?.url }}' (for testing purposes)</div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="justify-start items-start greyBorderTop">
    <q-tabs align="left" v-model="tab" no-caps>
      <q-tab name="tabdata" label="Tab Details" id="tabdataTab" />
      <q-tab name="content" label="Content" id="contentTab" />
      <!--      <q-tab name="meta" :label="metaDataLabel()"/>-->
      <q-tab name="request" :label="requestDataLabel()" />
      <q-tab name="metalinks" :label="metaLinksDataLabel()" />
      <q-tab name="links" :label="linksDataLabel()" />
      <q-tab name="debug" label="Debug" id="debugTab" />
    </q-tabs>
  </div>

  <div v-if="tab === 'tabdata'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded
        >Tabsets analyses the URLs you track in order to provide you with additional features like searching and
        thumbnails. This is the main info about this tab, retrieved when the page was opened in a tab.
      </q-banner>
      <div class="row items-baseline q-ma-lg">
        <div class="col-2">
          <q-img class="rounded-borders" width="32px" height="32px" :src="selectedTab?.favIconUrl">
            <q-tooltip>
              {{ selectedTab?.favIconUrl }} / {{ selectedTab?.chromeTabId }} / {{ selectedTab?.id }}
            </q-tooltip>
          </q-img>
        </div>
        <div class="col-10 text-body1 ellipsis">
          {{ getHost(selectedTab?.url || '', true) }}
        </div>
        <div class="col-12 text-body2 ellipsis">
          {{ selectedTab?.title }}
        </div>

        <div class="col-12">
          <div class="text-overline ellipsis">
            {{ selectedTab?.url }}&nbsp;<q-icon
              name="launch"
              color="secondary"
              @click.stop="NavigationService.openOrCreateTab([selectedTab?.url || ''])"></q-icon>
          </div>
        </div>
      </div>

      <div class="row items-baseline q-ma-none">
        <div class="col-7">
          <div class="row items-baseline q-ma-lg">
            <div class="col-3 text-subtitle1">Description</div>
            <div class="col-9 text-subtitle2">
              {{ selectedTab?.description }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="selectedTab?.longDescription">
            <div class="col-3 text-subtitle1">Long Description</div>
            <div
              class="col-9 text-subtitle2"
              v-if="selectedTab?.longDescription"
              v-html="selectedTab?.longDescription"></div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="selectedTab?.author">
            <div class="col-3 text-subtitle1">Author</div>
            <div class="col-9 text-subtitle2">
              {{ selectedTab?.author }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="selectedTab?.date">
            <div class="col-3 text-subtitle1">Date</div>
            <div class="col-9 text-subtitle2">
              {{ selectedTab?.date }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="selectedTab?.lastModified">
            <div class="col-3 text-subtitle1">Last Modified</div>
            <div class="col-9 text-subtitle2">
              {{ selectedTab?.lastModified }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="selectedTab?.keywords">
            <div class="col-3 text-subtitle1">Keywords</div>
            <div class="col-9 text-subtitle2">
              {{ selectedTab?.keywords }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="selectedTab?.image">
            <div class="col-3 text-subtitle1">Image</div>
            <div class="col-9 text-subtitle2">
              {{ selectedTab?.image }}<br />
              <q-img :src="selectedTab?.image" />
            </div>
          </div>
        </div>
        <div class="col-1"></div>
        <div class="col-4">
          <div class="row q-ma-lg">
            <div class="col-5 text-subtitle1">Created</div>
            <div class="col-7 text-subtitle2">
              {{ formatDate(selectedTab?.created) }}
              <q-tooltip>
                {{ date.formatDate(selectedTab?.created, 'DD.MM.YYYY HH:mm') }}
              </q-tooltip>
            </div>
            <div class="col-5 text-subtitle1">Updated</div>
            <div class="col-7 text-subtitle2">
              {{ formatDate(selectedTab?.updated) }}
              <q-tooltip>
                {{ date.formatDate(selectedTab?.updated, 'DD.MM.YYYY HH:mm') }}
              </q-tooltip>
            </div>
            <div class="col-5 text-subtitle1">last Active</div>
            <div class="col-7 text-subtitle2">
              {{ formatDate(selectedTab?.lastActive) }}
              <q-tooltip>
                {{ date.formatDate(selectedTab?.lastActive, 'DD.MM.YYYY HH:mm') }}
              </q-tooltip>
            </div>
            <div class="col-5 text-subtitle1">activated#</div>
            <div class="col-7 text-subtitle2">
              {{ selectedTab?.activatedCount }}
            </div>
          </div>
        </div>
      </div>

      <div class="row items-baseline q-ma-lg">
        <div class="col-12">
          <q-img :src="thumbnail" width="512px" style="border: 1px solid grey" />
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="tab === 'request'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded
        >This is a data derived from the request to the tabs content. This data is collected if the 'analyse tabs'
        feature is active.
      </q-banner>

      Status Code: {{ request['statusCode' as keyof object] }}<br /><br />

      <!--      <q-table-->
      <!--        title="Request data"-->
      <!--        :rows="requestRows"-->
      <!--        :columns="metaColumns!"-->
      <!--        row-key="name"-->
      <!--        :pagination="metaInitialPagination"-->
      <!--        :filter="filterRequest"-->
      <!--        dense-->
      <!--      >-->
      <!--        <template v-slot:top-right>-->
      <!--          <q-input borderless dense debounce="300" v-model="filterRequest" placeholder="Search">-->
      <!--            <template v-slot:append>-->
      <!--              <q-icon name="search"/>-->
      <!--            </template>-->
      <!--          </q-input>-->
      <!--        </template>-->

      <!--        <template v-slot:body-cell-name="props">-->
      <!--          <q-td :props="props">-->
      <!--            <div>-->
      <!--              <q-badge color="grey" class="cursor-pointer" @click="openNameLink(props.value)" :label="props.value"/>-->
      <!--            </div>-->
      <!--          </q-td>-->
      <!--        </template>-->

      <!--      </q-table>-->
    </div>
  </div>

  <div v-else-if="tab === 'metalinks'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded
        >This is a data derived from the tab's content link tags. This data is collected if the 'analyse tabs' feature
        is active. If this does not work as expected, you might have to refresh or reinstall the tabsets extension.
      </q-banner>

      <!--      <q-table-->
      <!--        title="Meta Links"-->
      <!--        :rows="metaLinkRows"-->
      <!--        :columns="metaLinkColumns"-->
      <!--        row-key="name"-->
      <!--        :pagination="metaInitialPagination"-->
      <!--        :filter="filterMetaLinks"-->
      <!--        dense>-->
      <!--        <template v-slot:top-right>-->
      <!--          <q-input borderless dense debounce="300" v-model="filterMetaLinks" placeholder="Search">-->
      <!--            <template v-slot:append>-->
      <!--              <q-icon name="search"/>-->
      <!--            </template>-->
      <!--          </q-input>-->
      <!--        </template>-->

      <!--        <template v-slot:body-cell-href="props">-->
      <!--          <q-td :props="props">-->
      <!--            <div class="cursor-pointer text-accent">-->
      <!--              <span v-if="props.row.href.length > 0 && props.row.href.startsWith('/')"-->
      <!--                    @click="openLink(selectedTab?.url + '/' + props.row.href.substring(1))">-->
      <!--                {{ props.row.href }}-->
      <!--              </span>-->
      <!--              <span v-else @click="openLink(props.row.href)">{{ props.row.href }}</span>-->
      <!--            </div>-->
      <!--          </q-td>-->
      <!--        </template>-->

      <!--      </q-table>-->
    </div>
  </div>

  <div v-else-if="tab === 'links'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded>This is data derived from the tab's html content</q-banner>

      <!--      <q-table-->
      <!--        title="Links"-->
      <!--        :rows="links()"-->
      <!--        :columns="linkColumns"-->
      <!--        row-key="name"-->
      <!--        :pagination="metaInitialPagination"-->
      <!--        :filter="filterMetaLinks"-->
      <!--        dense>-->
      <!--        <template v-slot:top-right>-->
      <!--          <q-input borderless dense debounce="300" v-model="filterMetaLinks" placeholder="Search">-->
      <!--            <template v-slot:append>-->
      <!--              <q-icon name="search"/>-->
      <!--            </template>-->
      <!--          </q-input>-->
      <!--        </template>-->

      <!--        <template v-slot:body-cell-link="props">-->
      <!--          <q-td :props="props">-->
      <!--            <div class="cursor-pointer text-accent">-->
      <!--              <span v-if="props.row.link.length > 0 && props.row.link.startsWith('/')"-->
      <!--                    @click="openLink(domain + '/' + props.row.link.substring(1))">-->
      <!--                {{ props.row.link }}-->
      <!--              </span>-->
      <!--              <span v-else @click="openLink(props.row.link)">{{ props.row.link }}</span>-->
      <!--            </div>-->
      <!--          </q-td>-->
      <!--        </template>-->

      <!--      </q-table>-->
    </div>
  </div>

  <div v-else-if="tab === 'content'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded>This is a text extract derived from the tabs content (ContentDB)</q-banner>

      <div class="col-5 text-h6">Title</div>
      <div class="col-7" data-testid="content-title">
        {{ content?.title }}
      </div>
      <div class="col-5 text-h6">URL</div>
      <div class="col-7" data-testid="content-url">
        {{ content?.url }}
      </div>
      <div class="col-5 text-h6">Meta</div>
      <div class="col-7 text-body2" data-testid="content-meta">
        <pre>
           {{ JSON.stringify(content?.metas || '{}', null, 2) }}
        </pre>
      </div>
      <div class="col-5 text-h6">Content</div>
      <div class="col-7" data-testid="content-content">
        {{ content?.content }}
      </div>
    </div>
  </div>

  <div v-else-if="tab === 'debug' && useSettingsStore().has('DEV_MODE')">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded>The tabs internal representation</q-banner>
      <vue-json-pretty
        style="font-size: 80%"
        :show-length="true"
        v-model:data="state.data"
        :show-double-quotes="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { date, openURL } from 'quasar'
import { useUtils } from 'src/core/services/Utils'
import { useSearchStore } from 'src/search/stores/searchStore'
import NavigationService from 'src/services/NavigationService'
import { onMounted, reactive, ref, watchEffect } from 'vue'
import VueJsonPretty from 'vue-json-pretty'
import { useRoute } from 'vue-router'
import 'vue-json-pretty/lib/styles.css'
import { ContentItem } from 'src/content/models/ContentItem'
import { useContentService } from 'src/content/services/ContentService'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const searchStore = useSearchStore()
const route = useRoute()

const { formatDate } = useUtils()

const selectedTab = ref<Tab | undefined>(undefined)
const domain = ref<string | undefined>(undefined)
const thumbnail = ref('')
const content = ref<ContentItem | undefined>(undefined)
const request = ref({})
const tab = ref('tabdata')
const keys = ref({})
const keysMap = ref({})
const index = ref({})

const json = ref(null)
const tags = ref<string[]>([])

const state = reactive({
  val: JSON.stringify(json),
  data: json,
})

onMounted(() => {
  Analytics.firePageViewEvent('TabPage', document.location.href)
})

onMounted(() => {
  console.log('query.tab', route.query)
  if (route.query.tab) {
    tab.value = route.query.tab as string
  }
})

watchEffect(() => {
  const tabId = route.params.id?.toString() || ''
  console.log('got tabId', tabId)
  const tabInfo = useTabsetsStore().getTabAndTabsetId(tabId)
  //.then((tabInfo: TabAndTabsetId | undefined) => {
  if (tabInfo) {
    console.log('got tab', tabInfo.tab)
    //useUiStore().setSelectedTab(tabInfo['tab' as keyof object] as Tab)
    json.value = JSON.parse(JSON.stringify(tabInfo.tab))
    tags.value = tabInfo.tab['tags' as keyof object]
    selectedTab.value = tabInfo.tab
    try {
      const url = new URL(selectedTab.value.url || '')
      domain.value = url.protocol + url.host
    } catch (err) {
      domain.value = selectedTab.value.url
    }
  } else {
    console.log('not found yet...')
  }
  // })
})

const metaColumns = ref([
  {
    name: 'name',
    required: true,
    label: 'Key',
    align: 'left',
    sortable: true,
    field: 'name',
  },
  { name: 'value', align: 'left', label: 'Value', field: 'value', sortable: true },
])

const metaLinkColumns = ref([
  { name: 'title', align: 'left', label: 'Title', field: 'title', sortable: true },
  { name: 'href', align: 'left', label: 'Link', field: 'href', sortable: true },
  { name: 'type', align: 'left', label: 'Type', field: 'type', sortable: true },
  { name: 'rel', align: 'left', label: 'Rel', field: 'rel', sortable: true },
])

const linkColumns = ref([
  { name: 'link', align: 'left', label: 'Link', field: 'link', sortable: true },
  { name: 'count', align: 'left', label: 'Count', field: 'count', sortable: true },
])

const metaInitialPagination = {
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 30,
}

const logsInitialPagination = {
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 30,
}

const metaRows = ref<object[]>([])
const requestRows = ref<object[]>([])
const metaLinkRows = ref<object[]>([])
const linkRows = ref<object[]>([])

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  if (selectedTab.value) {
    const data: ContentItem | undefined = await useContentService().getContent(selectedTab.value.id)
    if (data) {
      content.value = data
    }
  } else {
    //router.push("/tabset")
  }
})

const links = (): object[] => {
  const result: object[] = []
  if (linkRows.value) {
    const keys = Object.keys(linkRows.value)
    keys.forEach((k) => {
      result.push({
        link: k,
        count: linkRows.value[k as keyof object],
      })
    })
  }
  return result
}

watchEffect(() => {
  const fuseIndex = searchStore?.getIndex()
  if (fuseIndex) {
    keys.value = fuseIndex['keys' as keyof object] || {}
    keysMap.value = fuseIndex['_keysMap' as keyof object]
    const res = _.filter(fuseIndex['records' as keyof object], (r: any) => {
      return r.$[2]?.v === selectedTab.value?.url
    })
    if (res && res.length > 0) {
      index.value = res[0]
    }
  }
})

function getShortHostname(host: string) {
  const nrOfDots = (host.match(/\./g) || []).length
  if (nrOfDots >= 2) {
    return host.substring(host.indexOf('.', nrOfDots - 2) + 1)
  }
  return host
}

function getHost(urlAsString: string, shorten: Boolean = true): string {
  try {
    const url = new URL(urlAsString)
    if (!shorten) {
      return url.protocol + '://' + url.host.toString()
    }
    return getShortHostname(url.host)
  } catch (e) {
    return '---'
  }
}

const getForKey = (key: any) => {
  if (
    (keysMap.value[key as keyof object] || keysMap.value[key as keyof object] === 0) &&
    index.value['$' as keyof object]
  ) {
    return index.value['$' as keyof object][keysMap.value[key as keyof object]]
  }
  return ''
}

const requestDataLabel = () => 'Request Header (' + requestRows.value.length + ')'
const metaLinksDataLabel = () => 'Meta Links (' + metaLinkRows.value.length + ')'
const linksDataLabel = () => 'Links (' + Object.keys(linkRows.value || []).length + ')'
const openNameLink = (key: string) =>
  NavigationService.openOrCreateTab(['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/' + key])

const analyseTab = () => {
  if (selectedTab.value) {
    // searchStore.reindexTab(selectedTab.value)
    //   .then((windowId: number) => {
    //   })
  }
}

const openLink = (url: string) => openURL(url)
</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey
</style>
