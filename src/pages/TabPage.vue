<template>
  <q-page padding>

    <div class="text-h5 q-ml-md q-mb-lg ellipsis">
      Tab Details for '{{ notificationStore.selectedTab?.chromeTab?.url }}'
    </div>


    <div class="justify-start items-start">
      <q-tabs align="left" class="bg-grey-1"
              v-model="tab"
              no-caps>
        <q-tab name="tabdata" label="Tab"/>
        <q-tab name="meta" :label="metaDataLabel()"/>
        <q-tab name="history" label="History"/>
        <q-tab name="content" label="Content"/>
        <q-tab name="index" label="Search Index"/>
        <q-tab name="request" :label="requestDataLabel()"/>
      </q-tabs>
    </div>

    <div v-if="tab === 'tabdata'">
      <div class="row items-baseline q-ma-lg">
        <div class="col-2">
          <q-img
            class="rounded-borders"
            width="32px"
            height="32px"
            :src="notificationStore.selectedTab?.chromeTab?.favIconUrl">
            <q-tooltip>
              {{ notificationStore.selectedTab?.chromeTab?.favIconUrl }} / {{
                notificationStore.selectedTab?.chromeTab?.id
              }} / {{ notificationStore.selectedTab.id }}
            </q-tooltip>
          </q-img>
        </div>
        <div class="col-10 text-body1 ellipsis">
          {{ getHost(notificationStore.selectedTab?.chromeTab?.url, true) }}
        </div>
        <div class="col-12 text-body2 ellipsis">
          {{ notificationStore.selectedTab?.chromeTab?.title }}
        </div>

        <div class="col-12">
          <div class="text-overline ellipsis">
            {{ notificationStore.selectedTab?.chromeTab?.url }}&nbsp;<q-icon name="launch" color="secondary"
                                                                             @click.stop="NavigationService.openOrCreateTab(tab.chromeTab?.url )"></q-icon>
          </div>
        </div>
      </div>
      <div class="row items-baseline q-ma-lg">
        <div class="col-5">
          Description
        </div>
        <div class="col-7">
          {{ notificationStore.selectedTab?.description }}
        </div>
      </div>

      <div class="row items-baseline q-ma-lg">
        <div class="col-12">
          <q-img :src="thumbnail" width="512px" style="border:1px solid grey"/>
        </div>
      </div>

      <div class="row q-ma-sm">
        <div class="col-5">
          created
        </div>
        <div class="col-7">
          {{ date.formatDate(notificationStore.selectedTab?.created, 'DD.MM.YYYY HH:mm') }}
        </div>
        <div class="col-5">
          updated
        </div>
        <div class="col-7">
          {{ date.formatDate(notificationStore.selectedTab?.updated, 'DD.MM.YYYY HH:mm') }}
        </div>
        <div class="col-5">
          last Active
        </div>
        <div class="col-7">
          {{ date.formatDate(notificationStore.selectedTab?.lastActive, 'DD.MM.YYYY HH:mm') }}
        </div>
        <div class="col-5">
          activated#
        </div>
        <div class="col-7">
          {{ notificationStore.selectedTab?.activatedCount }}
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'meta'">

      <div class="q-pa-md">

        <q-table
          title="Meta data from the website source"
          :rows="metaRows"
          :columns="metaColumns"
          row-key="name"
          :pagination="metaInitialPagination"
          :filter="filter"
          dense
        >
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

    <div v-else-if="tab === 'history'">
      ---
    </div>
    <div v-else-if="tab === 'content'">
      <div class="col-5">
        Content
      </div>
      <div class="col-7">
        {{ content }}
      </div>
    </div>

    <div v-else-if="tab === 'index'">

      <div v-for="k in keys">
        ID: {{ k.id }} - weight {{ k.weight }}
      </div>
      <hr>
      <div v-for="key in Object.keys(keysMap)">
        <div v-if="keysMap.hasOwnProperty(key)">
          <b>key: {{ key }} - {{ keysMap[key] }}</b><br>
          {{ getForKey(key) }}
          <!--          {{ index.$[keysMap[key]] }}<br><br>-->
        </div>
      </div>

    </div>

    <div v-else-if="tab === 'request'">

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
  </q-page>

</template>

<script setup lang="ts">
import {useTabsStore} from "src/stores/tabsStore"
import {useNotificationsStore} from "src/stores/notificationsStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRoute, useRouter} from "vue-router";
import {ref, watchEffect} from "vue";
import TabsetService from "src/services/TabsetService";
import NavigationService from "src/services/NavigationService"
import {date} from "quasar";
import {useSearchStore} from "stores/searchStore";
import _ from "lodash"

const tabsStore = useTabsStore()
const notificationStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const searchStore = useSearchStore()
const router = useRouter()
const route = useRoute()

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

const metaInitialPagination = {
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 30
}

const metaRows = ref<object[]>([])
const requestRows = ref<object[]>([])

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
  if (notificationStore.selectedTab) {
    TabsetService.getThumbnailFor(notificationStore.selectedTab)
      .then(data => {
        if (data) {
          thumbnail.value = data.thumbnail
        }
      })
    TabsetService.getContentFor(notificationStore.selectedTab)
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
    TabsetService.getRequestFor(notificationStore.selectedTab)
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

  } else {
    //router.push("/tabset")
  }
})

watchEffect(() => {
  const fuseIndex = searchStore?.getIndex()
  keys.value = fuseIndex['keys' as keyof object]
  keysMap.value = fuseIndex['_keysMap' as keyof object]
  const res = _.filter(fuseIndex['records' as keyof object], (r: any) => {
    return notificationStore.selectedTab?.chromeTab.url === r.$[3]?.v
  })
  // console.log("res", res, res.length)
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
  if (keysMap.value[key as keyof object]
    && index.value['$' as keyof object]) {
    return index.value['$' as keyof object][keysMap.value[key as keyof object]]
  }
  return ""
}

const metaDataLabel = () => "Meta Data (" + metaRows.value.length + ")"
const requestDataLabel = () => "Request Header (" + requestRows.value.length + ")"
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

</script>
