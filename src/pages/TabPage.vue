<template>

  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          Tab Info for '{{ useUiStore().getSelectedTab?.chromeTab?.url }}' (experimental)
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>


  <div class="justify-start items-start greyBorderTop">
    <q-tabs align="left" class="bg-grey-1"
            v-model="tab"
            no-caps>
      <q-tab name="tabdata" label="Tab Details"/>
      <q-tab name="meta" :label="metaDataLabel()"/>
      <q-tab name="request" :label="requestDataLabel()"/>
      <q-tab name="metalinks" :label="metaLinksDataLabel()"/>
      <q-tab name="links" :label="linksDataLabel()"/>
      <q-tab name="history" label="History"/>
      <q-tab name="content" label="Content"/>
      <q-tab name="debug" label="Debug"/>
    </q-tabs>
  </div>

  <div v-if="tab === 'tabdata'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">Tabsets analyses the URLs you track in order to provide you with
        additional features like searching and thumbnails.
        This is the main info about this tab, retrieved when the page was opened in a tab.
      </q-banner>
      <div class="row items-baseline q-ma-lg">
        <div class="col-2">
          <q-img
            class="rounded-borders"
            width="32px"
            height="32px"
            :src="useUiStore().getSelectedTab?.chromeTab?.favIconUrl">
            <q-tooltip>
              {{ useUiStore().getSelectedTab?.chromeTab?.favIconUrl }} / {{
                useUiStore().getSelectedTab?.chromeTab?.id
              }} / {{ useUiStore().getSelectedTab.id }}
            </q-tooltip>
          </q-img>
        </div>
        <div class="col-10 text-body1 ellipsis">
          {{ getHost(useUiStore().getSelectedTab?.chromeTab?.url, true) }}
        </div>
        <div class="col-12 text-body2 ellipsis">
          {{ useUiStore().getSelectedTab?.chromeTab?.title }}
        </div>

        <div class="col-12">
          <div class="text-overline ellipsis">
            {{ useUiStore().getSelectedTab?.chromeTab?.url }}&nbsp;<q-icon name="launch" color="secondary"
                                                                           @click.stop="NavigationService.openOrCreateTab(tab.chromeTab?.url )"></q-icon>
          </div>
        </div>
      </div>

      <div class="row items-baseline q-ma-none">
        <div class="col-7">
          <div class="row items-baseline q-ma-lg">
            <div class="col-3 text-subtitle1">
              Description
            </div>
            <div class="col-9 text-subtitle2">
              {{ useUiStore().getSelectedTab?.description }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="useUiStore().getSelectedTab?.author">
            <div class="col-3 text-subtitle1">
              Author
            </div>
            <div class="col-9 text-subtitle2">
              {{ useUiStore().getSelectedTab?.author }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="useUiStore().getSelectedTab?.date">
            <div class="col-3 text-subtitle1">
              Date
            </div>
            <div class="col-9 text-subtitle2">
              {{ useUiStore().getSelectedTab?.date }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="useUiStore().getSelectedTab?.lastModified">
            <div class="col-3 text-subtitle1">
              Last Modified
            </div>
            <div class="col-9 text-subtitle2">
              {{ useUiStore().getSelectedTab?.lastModified }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="useUiStore().getSelectedTab?.keywords">
            <div class="col-3 text-subtitle1">
              Keywords
            </div>
            <div class="col-9 text-subtitle2">
              {{ useUiStore().getSelectedTab?.keywords }}
            </div>
          </div>
          <div class="row items-baseline q-ma-lg" v-if="useUiStore().getSelectedTab?.image">
            <div class="col-3 text-subtitle1">
              Image
            </div>
            <div class="col-9 text-subtitle2">
              {{ useUiStore().getSelectedTab?.image }}<br>
              <q-img :src="useUiStore().getSelectedTab?.image"/>
            </div>
          </div>
        </div>
        <div class="col-1"></div>
        <div class="col-4">
          <div class="row q-ma-lg">
            <div class="col-5 text-subtitle1">
              Created
            </div>
            <div class="col-7 text-subtitle2">
              {{ formatDate(useUiStore().getSelectedTab?.created) }}
              <q-tooltip>
                {{ date.formatDate(useUiStore().getSelectedTab?.created, 'DD.MM.YYYY HH:mm') }}
              </q-tooltip>
            </div>
            <div class="col-5 text-subtitle1">
              Updated
            </div>
            <div class="col-7 text-subtitle2">
              {{ formatDate(useUiStore().getSelectedTab?.updated) }}
              <q-tooltip>
                {{ date.formatDate(useUiStore().getSelectedTab?.updated, 'DD.MM.YYYY HH:mm') }}
              </q-tooltip>
            </div>
            <div class="col-5 text-subtitle1">
              last Active
            </div>
            <div class="col-7 text-subtitle2">
              {{ formatDate(useUiStore().getSelectedTab?.lastActive) }}
              <q-tooltip>
                {{ date.formatDate(useUiStore().getSelectedTab?.lastActive, 'DD.MM.YYYY HH:mm') }}
              </q-tooltip>
            </div>
            <div class="col-5 text-subtitle1">
              activated#
            </div>
            <div class="col-7 text-subtitle2">
              {{ useUiStore().getSelectedTab?.activatedCount }}
            </div>
          </div>
        </div>
      </div>

      <div class="row items-baseline q-ma-lg">
        <div class="col-12">
          <q-img :src="thumbnail" width="512px" style="border:1px solid grey"/>
        </div>
      </div>
      <hr>
      <div class="row items-baseline q-ma-lg">
        <div class="col-12">
          Not happy with the results?
        </div>
        <div class="col-12">
          <q-btn label="Rerun Analysis" @click="analyseTab"/>
        </div>
        <div class="col-12">
          This will open a new window, analyse the page and close it again.
        </div>

      </div>


    </div>
  </div>

  <div v-else-if="tab === 'meta'">

    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">This meta data was derived from the pages provided meta tags.
        This data is collected if the 'analyse tabs' feature is active.
        If this does not work as expected, you might have to refresh or reinstall the tabsets extension.
      </q-banner>

      <q-table
        title="Meta data from the website source"
        :rows="metaRows"
        :columns="metaColumns"
        row-key="name"
        :pagination="metaInitialPagination"
        :filter="filter"
        dense>

        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div>
              <q-badge v-if="showNameLink(props.value)"
                       color="grey" class="cursor-pointer" @click="openNameLink(props.value)" :label="props.value"/>
              <q-badge v-else
                       color="grey" @click="openNameLink(props.value)" :label="props.value"/>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-value="props">
          <q-td :props="props">
            <div>
              {{ props.value }}
              <q-icon v-if="showValueLink(props.key)"
                      name="o_open_in_new" @click="openValueLink(props.key, props.value)"/>
            </div>
          </q-td>
        </template>

      </q-table>

    </div>

  </div>

  <div v-else-if="tab === 'request'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">This is a data derived from the request to the tabs content. This
        data is collected if the 'analyse tabs' feature is active.
      </q-banner>

      Status Code: {{ request['statusCode'] }}<br><br>

      <q-table
        title="Request data"
        :rows="requestRows"
        :columns="metaColumns"
        row-key="name"
        :pagination="metaInitialPagination"
        :filter="filterRequest"
        dense
      >
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filterRequest" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <div>
              <q-badge color="grey" class="cursor-pointer" @click="openNameLink(props.value)" :label="props.value"/>
            </div>
          </q-td>
        </template>

      </q-table>
    </div>
  </div>

  <div v-else-if="tab === 'metalinks'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">This is a data derived from the tab's content link tags. This
        data is collected if the 'analyse tabs' feature is active.
        If this does not work as expected, you might have to refresh or reinstall the tabsets extension.
      </q-banner>

      <q-table
        title="Meta Links"
        :rows="metaLinkRows"
        :columns="metaLinkColumns"
        row-key="name"
        :pagination="metaInitialPagination"
        :filter="filterMetaLinks"
        dense>
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filterMetaLinks" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-href="props">
          <q-td :props="props">
            <div class="cursor-pointer text-blue-10">
              <span v-if="props.row.href.length > 0 && props.row.href.startsWith('/')"
                    @click="openLink(useUiStore().getSelectedTab.chromeTab.url + '/' + props.row.href.substring(1))">
                {{ props.row.href }}
              </span>
              <span v-else @click="openLink(props.row.href)">{{ props.row.href }}</span>
            </div>
          </q-td>
        </template>

      </q-table>
    </div>
  </div>

  <div v-else-if="tab === 'links'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">This is a data derived from the tab's html content</q-banner>

      <q-table
        title="Links"
        :rows="links()"
        :columns="linkColumns"
        row-key="name"
        :pagination="metaInitialPagination"
        :filter="filterMetaLinks"
        dense>
        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filterMetaLinks" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
        </template>

        <template v-slot:body-cell-link="props">
          <q-td :props="props">
            <div class="cursor-pointer text-blue-10">
              <span v-if="props.row.link.length > 0 && props.row.link.startsWith('/')"
                    @click="openLink(useUiStore().getSelectedTab.chromeTab.url + '/' + props.row.link.substring(1))">
                {{ props.row.link }}
              </span>
              <span v-else @click="openLink(props.row.link)">{{ props.row.link }}</span>
            </div>
          </q-td>
        </template>

      </q-table>
    </div>
  </div>

  <div v-else-if="tab === 'history'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">To be done</q-banner>
    </div>
  </div>

  <div v-else-if="tab === 'content'">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">This is a text extract derived from the tabs content</q-banner>

      <div class="col-5">
        Content
      </div>
      <div class="col-7">
        {{ content }}
      </div>
    </div>
  </div>

  <div v-else-if="tab === 'debug'" v-if="useSettingsStore().isEnabled('dev')">
    <div class="q-pa-md q-gutter-sm">
      <q-banner rounded class="bg-grey-1 text-primary">The tabs internal representation</q-banner>
      <vue-json-pretty style="font-size: 80%"
                       v-model:data="state.data"
                       :show-double-quotes="true"
      />
    </div>
  </div>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useRoute, useRouter} from "vue-router";
import {reactive, ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import NavigationService from "src/services/NavigationService"
import {date} from "quasar";
import {useSearchStore} from "src/stores/searchStore";
import _ from "lodash"
import {useUtils} from "src/services/Utils";
import {useUiStore} from "src/stores/uiStore";
import {openURL} from "quasar";
import {useSettingsStore} from "src/stores/settingsStore"
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';

const tabsStore = useTabsStore()
const notificationStore = useNotificationsStore()
const featuresStore = useSettingsStore()
const searchStore = useSearchStore()
const router = useRouter()
const route = useRoute()

const {formatDate} = useUtils()

const thumbnail = ref('')
const content = ref('')
const request = ref({})
const metas = ref({})
const tab = ref('tabdata')
const keys = ref({})
const keysMap = ref({})
const index = ref({})
const filter = ref('')
const filterRequest = ref('')
const filterMetaLinks = ref('')

const json = ref(null)
const tags = ref<string[]>([])

const state = reactive({
  val: JSON.stringify(json),
  data: json
})

watchEffect(() => {
  const selectedTab = useUiStore().getSelectedTab
  if (selectedTab) {
    json.value = JSON.parse(JSON.stringify(selectedTab))
    tags.value = selectedTab.tags
  }
})


const metaColumns = ref([
  {
    name: 'name',
    required: true,
    label: 'Key',
    align: 'left',
    sortable: true,
    field: 'name'
  },
  {name: 'value', align: 'left', label: 'Value', field: 'value', sortable: true}

])

const metaLinkColumns = ref([
  {name: 'title', align: 'left', label: 'Title', field: 'title', sortable: true},
  {name: 'href', align: 'left', label: 'Link', field: 'href', sortable: true},
  {name: 'type', align: 'left', label: 'Type', field: 'type', sortable: true},
  {name: 'rel', align: 'left', label: 'Rel', field: 'rel', sortable: true}
])


const linkColumns = ref([
  {name: 'link', align: 'left', label: 'Link', field: 'link', sortable: true},
  {name: 'count', align: 'left', label: 'Count', field: 'count', sortable: true}
])


const metaInitialPagination = {
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 30
}

const logsInitialPagination = {
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 30
}

const metaRows = ref<object[]>([])
const requestRows = ref<object[]>([])
const metaLinkRows = ref<object[]>([])
const linkRows = ref<object[]>([])

const logs = ref<any[]>([])
const logsFilter = ref('')
const logsColumns = ref([
  {name: 'timestamp', align: 'left', label: 'Timestamp', field: 'timestamp', sortable: true},
  // {name: 'context', align: 'left', label: 'Context', field: 'context', sortable: true},
  {name: 'level', align: 'left', label: 'Level', field: 'level', sortable: true},
  {name: 'msg', align: 'left', label: 'Message', field: 'msg', sortable: true}
])

// useQueryExecutor()
//   .queryFromUi(new TabLogsQuery(useUiStore().getSelectedTab?.chromeTab.url || ''))
//   .then(res => {
//     logs.value = res.result
//   })
//.catch((err) => logger.warning(err))


watchEffect(() => {
  const tabId = route.params.id
  if (tabId) {
    const tab = tabsStore.getTab(tabId as unknown as string)
    if (tab) {
      notificationStore.setSelectedTab(tab)
    }
  }
})

watchEffect(() => {
  const selectedTab = useUiStore().getSelectedTab
  if (selectedTab) {
    TabsetService.getThumbnailFor(selectedTab)
      .then(data => {
        if (data) {
          thumbnail.value = data.thumbnail
        }
      })
    TabsetService.getContentFor(selectedTab)
      .then(data => {
        if (data) {
          content.value = data.content
          metas.value = data.metas
          metaRows.value = []
          _.forEach(Object.keys(data.metas), k => {
            //console.log("k", k, data.metas[k])
            metaRows.value.push({
              name: k,
              value: data.metas[k]
            })
          })
        }
      })
    TabsetService.getRequestFor(selectedTab)
      .then(data => {
        if (data) {
          //console.log("got data", data)
          request.value = data.requestInfo

          _.forEach(data.requestInfo['headers'], h => {
            requestRows.value.push({
              name: h.name,
              value: h.value
            })
          })
        }
      })

    TabsetService.getMetaLinksFor(selectedTab)
      .then(data => {
        if (data) {
          metaLinkRows.value = data.metaLinks
        }
      })

    TabsetService.getLinksFor(selectedTab)
      .then(data => {
        if (data) {
          linkRows.value = data.links
        }
      })

  } else {
    //router.push("/tabset")
  }
})

const links = (): object[] => {
  const keys = Object.keys(linkRows.value)
  const result: object[] = []
  keys.forEach(k => {
    result.push({
      link: k,
      count: linkRows.value[k as keyof object]
    })
  })
  return result
}

watchEffect(() => {
  const fuseIndex = searchStore?.getIndex()
  keys.value = fuseIndex['keys' as keyof object]
  keysMap.value = fuseIndex['_keysMap' as keyof object]
  const res = _.filter(fuseIndex['records' as keyof object], (r: any) => {
    return useUiStore().getSelectedTab?.chromeTab.url === r.$[2]?.v
  })
  if (res && res.length > 0) {
    index.value = res[0]
  }
})


function getShortHostname(host: string) {
  const nrOfDots = (host.match(/\./g) || []).length
  if (nrOfDots >= 2) {
    return host.substring(host.indexOf(".", nrOfDots - 2) + 1)
  }
  return host
}

function getHost(urlAsString: string, shorten: Boolean = true): string {
  try {
    const url = new URL(urlAsString)
    if (!shorten) {
      return url.protocol + "://" + url.host.toString()
    }
    return getShortHostname(url.host)
  } catch (e) {
    return "---";
  }
}

const getForKey = (key: any) => {
  if ((keysMap.value[key as keyof object] || keysMap.value[key as keyof object] === 0)
    && index.value['$' as keyof object]) {
    return index.value['$' as keyof object][keysMap.value[key as keyof object]]
  }
  return ""
}

const metaDataLabel = () => "Meta Data (" + metaRows.value.length + ")"
const requestDataLabel = () => "Request Header (" + requestRows.value.length + ")"
const metaLinksDataLabel = () => "Meta Links (" + metaLinkRows.value.length + ")"
const linksDataLabel = () => "Links (" + Object.keys(linkRows.value).length + ")"
const openNameLink = (key: string) => NavigationService.openOrCreateTab("https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/" + key)
const showNameLink = (key: string) => key.indexOf(":") < 0;

const openValueLink = (name: any, value: string) => {
  if ("fb:page_id" === name) {
    NavigationService.openOrCreateTab("https://www.facebook.com/" + value)
  } else if ("twitter:account_id" === name) {
    NavigationService.openOrCreateTab("https://twitter.com/i/user/" + value)
  }
  return
}
const showValueLink = (name: string) => "fb:page_id" === name || "twitter:account_id" === name

const analyseTab = () => {
  const selectedTab = useUiStore().getSelectedTab
  if (selectedTab) {
    searchStore.reindexTab(selectedTab)
      .then((windowId: number) => {
      })
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
