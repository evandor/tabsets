<template>
  <div class="q-ma-none">
    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-2">
              <q-icon name="chevron_left" class="cursor-pointer" @click="router.push('/sidepanel')">
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col-10">Tab Details</div>
            <div class="col-1 text-right"></div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="row items-baseline q-mx-sm q-my-sm">
      <div class="col-2">
        <TabFaviconWidget v-if="tab" class="q-mr-md q-mb-md" :tab="tab as Tab" width="24px" height="24px" />
      </div>
      <div class="col-10 text-body1 ellipsis-3">
        {{ getHost(tab?.url || '', true) }}
      </div>
      <div class="col-12 text-body2 ellipsis-3">
        {{ tab?.title }}
      </div>

      <div class="col-12">
        <div
          class="text-overline ellipsis text-accent cursor-pointer"
          @click.stop="NavigationService.openOrCreateTab([tab?.url || ''])">
          {{ tab?.url }}&nbsp;<q-icon name="launch" color="secondary" class="cursor-pointer"></q-icon>
        </div>
        <div class="text-body2 ellipsis q-mb-sm">
          Size: {{ Math.round(JSON.stringify(tab || '').length / 1024) + ' kByte' }}
        </div>
        <div class="text-body2 ellipsis">ID: {{ tab?.id }}</div>
      </div>
    </div>

    <div class="row q-ma-sm">
      <div class="col-5 text-caption text-bold">In tabsets:</div>
      <div class="col-7 text-right">
        <q-chip
          v-for="chip in tabsetChips()"
          class="cursor-pointer q-ml-xs"
          size="8px"
          clickable
          icon="tab"
          @click="openTabset(chip)">
          {{ chip['label' as keyof object] }}
        </q-chip>
      </div>
    </div>

    <div class="row q-ma-sm">
      <div class="col-5 text-caption text-bold">In Bookmarks:</div>
      <div class="col-7 text-right">...</div>
    </div>

    <div class="row q-ma-sm">
      <div class="col-12" v-if="true">
        <q-img :src="thumbnail" style="border: 1px dotted grey; border-radius: 5px" no-native-menu />
      </div>
      <div class="col-12 bg-amber-1" v-else-if="!inBexMode()">
        <!--        <q-img src="thumbnail-not-available.png" style="border:1px solid grey;border-radius: 5px;" no-native-menu/>-->
      </div>
      <div class="col-12" v-else>
        <q-banner rounded style="border: 1px solid grey; border-radius: 5px">
          If you want to have thumbnails of your tabs, additional permissions are needed.<br /><br />
          Click
          <span
            class="cursor-pointer text-blue-6"
            style="text-decoration: underline"
            @click="router.push('/features/thumbnails')"
            >here</span
          >
          to grant permissions for the tabset extension to create thumbnails for your tabs.
        </q-banner>
      </div>

      <div class="col-3 text-left">
        <q-btn
          v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)"
          @click="showTabDetails"
          round
          size="11px"
          flat
          icon="o_more_horiz">
          <q-tooltip>Show additional information about this tab (developer mode)</q-tooltip>
        </q-btn>
      </div>
      <div class="col-9 text-right"></div>
    </div>
  </div>

  <q-separator />

  <q-list>
    <q-expansion-item group="detailsGroup" label="Quick Access Shortcut" :default-opened="false">
      <q-card>
        <q-card-section>
          <q-input filled dense v-model="quickaccess" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item group="detailsGroup" label="Tags" :default-opened="false">
      <q-card>
        <q-card-section>
          <q-select
            filled
            v-model="tags"
            use-input
            use-chips
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add-unique"
            @update:model-value="(val) => updatedTags(val)"
            style="width: 250px" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      :label="'Meta Data (#' + (4 + metaRows.length) + ')'"
      group="detailsGroup"
      :default-opened="tab?.note === undefined">
      <q-card>
        <q-card-section>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-5 text-caption text-bold">created</div>
            <div class="col-7 text-right text-caption">{{ formatDate(tab?.created) }}</div>
          </div>
          <div class="row q-mx-sm">
            <div class="col-5 text-caption text-bold">changed</div>
            <div class="col-7 text-right text-caption">{{ formatDate(tab?.updated) }}</div>
          </div>
          <div class="row q-mx-sm">
            <div class="col-5 text-caption text-bold">last active</div>
            <div class="col-7 text-right text-caption">{{ formatDate(tab?.lastActive) }}</div>
          </div>
          <div class="row q-mx-sm">
            <div class="col-5 text-caption text-bold">opened</div>
            <div class="col-7 text-right text-caption">{{ tab?.activatedCount }}x</div>
          </div>

          <template v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">
            <div class="row q-mx-sm">
              <div class="col-12 text-caption text-bold q-px-xl">
                <hr />
              </div>
            </div>
            <div class="row q-mx-sm" v-for="metaRow in metaRows">
              <div class="col-5 text-caption text-bold">{{ metaRow['name' as keyof object] }}</div>
              <div class="col-7 text-right text-caption ellipsis">
                {{ metaRow }}
                <q-tooltip>{{ metaRow }}</q-tooltip>
              </div>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item :label="'Http Status: ' + tab?.httpStatus" group="detailsGroup">
      <q-card>
        <q-card-section>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-5 text-caption text-bold">Http Status</div>
            <div class="col-7 text-right text-caption">{{ tab?.httpStatus }}</div>
          </div>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-5 text-caption text-bold">Checked At</div>
            <div class="col-7 text-right text-caption">{{ formatDate(tab?.httpCheckedAt) }}</div>
          </div>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-5 text-caption text-bold">Info</div>
            <div class="col-7 text-right text-caption">{{ tab?.httpInfo }}</div>
          </div>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-5 text-caption text-bold">Content Type</div>
            <div class="col-7 text-right text-caption">{{ tab?.httpContentType }}</div>
          </div>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-5 text-caption text-bold">Last Modified</div>
            <div class="col-7 text-right text-caption">{{ tab?.httpLastModified }}</div>
          </div>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-5 text-caption text-bold">Error</div>
            <div class="col-7 text-right text-caption">{{ tab?.httpError }}</div>
          </div>
          <div class="row q-mx-sm q-mt-none">
            <div class="col-12 text-caption text-bold">Request Headers</div>
          </div>
          <div class="row q-mx-sm" v-for="headerRow in request?.headers">
            <div class="col-5 text-caption text-bold">{{ headerRow['name' as keyof object] }}</div>
            <div class="col-7 text-right text-caption ellipsis">
              {{ headerRow['value' as keyof object] }}
              <q-tooltip>{{ headerRow }}</q-tooltip>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      :label="'Tab References (#' + tab.tabReferences.length + ')'"
      group="tabrefgroup"
      v-if="tab && tab.tabReferences">
      <div class="q-ma-sm q-ml-lg" v-for="ref in tab.tabReferences">
        <template v-if="ref.type === TabReferenceType.RSS">
          <div class="text-caption text-bold">found RSS ({{ ref.status }}):</div>
          <div
            class="text-caption ellipsis text-accent cursor-pointer"
            @click="useNavigationService().browserTabFor(ref.href || '')">
            {{ ref.href }}
          </div>
        </template>
        <template v-else-if="ref.type === TabReferenceType.META_DATA">
          <div class="text-caption text-bold">found Meta Data:</div>
          <div class="text-caption ellipsis">
            <div class="row" v-for="item in ref.data">
              <div class="col-4 ellipsis">{{ item['name' as keyof object] }}:</div>
              <div class="col ellipsis">
                {{ item['content' as keyof object] }}
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="ref.type === TabReferenceType.OPEN_SEARCH">
          <div class="text-caption text-bold">found Open Search Description:</div>
          <!--          <div class="text-caption">-->
          <!--            {{ ref.data }}-->
          <!--          </div>-->
          <div>
            <div class="row" v-if="ref.data">
              <div class="col-10 ellipsis">
                <q-input dense v-model="opensearchterm" type="text" />
              </div>
              <div class="col">
                <q-btn dense icon="search" size="sm" @click="openSearch()" />
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="ref.type === TabReferenceType.OPEN_GRAPH">
          <div class="text-caption text-bold">found Open Graph Data:</div>
          <div class="text-caption ellipsis">
            <div class="row" v-for="item in ref.data">
              <div class="col-4 ellipsis">{{ item['property' as keyof object] }}:</div>
              <div class="col ellipsis">
                {{ item['content' as keyof object] }}
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="ref.type === TabReferenceType.READING_MODE">
          <div class="text-caption text-bold">found Reading Mode Article:</div>
          <div class="text-caption ellipsis">
            <div class="row">
              <div class="col-12 ellipsis">{{ ref.data[0]!['title' as keyof object] }}:</div>
            </div>
          </div>
        </template>
        <template v-else-if="ref.type === TabReferenceType.LINKING_DATA">
          <div class="text-caption text-bold">found Linking Data:</div>
          <div class="text-caption">
            <div class="cursor-pointer" @click="openInJsonCrackEditor(JSON.stringify(ref.data))">
              {{ linkingHeading(ref.data) }}
            </div>
          </div>
        </template>
        <template v-else-if="ref.type === TabReferenceType.PARENT_CHAIN">
          <div class="text-caption text-bold">found Parents in Path:</div>
          <div class="text-caption">
            <div class="cursor-pointer" @click="openInJsonCrackEditor(JSON.stringify(ref.data))">
              {{ ref.title }}
            </div>
            <ul>
              <li
                v-for="p in ref.data"
                class="ellipsis"
                @click="useNavigationService().browserTabFor(p['parent' as keyof object])">
                {{ p['parent' as keyof object] }}
              </li>
            </ul>
          </div>
        </template>
        <template v-else>
          <div class="text-caption">
            {{ ref.type }}:<br />
            {{ ref }}
          </div>
        </template>
      </div>
    </q-expansion-item>

    <q-expansion-item group="detailsGroup" :label="'Search Index (' + indexTypesCount + ' categories)'">
      <q-card>
        <q-card-section>
          <div class="row q-mx-sm">
            <TabDetailsSearchIndex @count="(v: number) => (indexTypesCount = v)" v-if="tab" :tab="tab" />
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item v-if="tab?.comments" group="detailsGroup" :label="'Comments (' + tab.comments.length + ')'">
      <q-card>
        <q-card-section>
          <div v-for="c of tab.comments">
            <pre class="text-body2">{{ c }}</pre>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>
</template>

<script lang="ts" setup>
import { formatDistance } from 'date-fns'
import _ from 'lodash'
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { STRIP_CHARS_IN_USER_INPUT } from 'src/boot/constants'
import { TabReferenceType } from 'src/content/models/TabReference'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import TabDetailsSearchIndex from 'src/pages/sidepanel/helper/TabDetailsSearchIndex.vue'
import { RequestInfo } from 'src/requests/models/RequestInfo'
import { useRequestsService } from 'src/requests/services/RequestsService'
import NavigationService from 'src/services/NavigationService'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'
import { useAuthStore } from 'src/stores/authStore'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import TabsetService from 'src/tabsets/services/TabsetService'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { inBexMode } = useUtils()

const { handleSuccess, handleError } = useNotificationHandler()

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const thumbnail = ref('')
const content = ref('')
const quickaccess = ref('')
const metaRows = ref<object[]>([])
const tab = ref<Tab | undefined>(undefined)
const htmls = ref<BlobMetadata[]>([])
const request = ref<RequestInfo | undefined>(undefined)
const tabId = ref<string | undefined>(undefined)
const opensearchterm = ref<string | undefined>(undefined)
const indexTypesCount = ref(0)

const tags = ref<string[]>([])

watchEffect(() => {
  tabId.value = route.params.tabId as unknown as string
  console.log('tabid', tabId.value)

  const tabObject = useTabsetsStore().getTabAndTabsetId(tabId.value)
  if (tabObject) {
    tab.value = tabObject.tab
    // console.log('tab.tags.value', tab.value.tags)
    if (tab.value.tags.constructor === Array) {
      tags.value = [...new Set(tab.value.tags)]
      // remove duplicates if any
      // tab.value.setTags(tags.value)
      Tab.setTags(tab.value, tags.value)
    } else {
      tags.value = []
    }
    quickaccess.value = tab.value.quickaccess
  }
  if (tab.value) {
    useRequestsService()
      .getWebRequestFor(tab.value.id)
      .then((res: RequestInfo) => {
        request.value = res
      })
  }
})

watchEffect(() => {
  if (quickaccess.value && tab.value) {
    quickaccess.value = quickaccess.value.replace(' ', '').replace(STRIP_CHARS_IN_USER_INPUT, '')
    tab.value.quickaccess = quickaccess.value
    useTabsetService()
      .saveCurrentTabset()
      .catch((err) => console.error(err))
  }
})

watchEffect(() => {
  if (tab.value) {
    useThumbnailsService()
      .getThumbnailFor(tab.value.id, useAuthStore().user.uid)
      .then((data) => {
        if (data) {
          thumbnail.value = data
        } else {
          thumbnail.value = ''
        }
      })
    TabsetService.getContentFor(tab.value as Tab).then((data) => {
      if (data) {
        content.value = data['content' as keyof object]
        //metas.value = data['metas' as keyof object]
        metaRows.value = []
        _.forEach(Object.keys(data['metas' as keyof object]), (k: any) => {
          //console.log("k", k, data.metas[k])
          metaRows.value.push({
            name: k,
            value: data['metas' as keyof object][k],
          })
        })
        metaRows.value = _.sortBy(metaRows.value, (s: any) => s['name' as keyof object])
      }
    })
    useSnapshotsService()
      .getMetadataFor(tab.value.id)
      .then((mds: BlobMetadata[]) => {
        htmls.value = mds
      })

    // useSnapshotsService().getPngsForTab(tab.value.id)
    //     .then((blobs: SavedBlob[]) => pngs.value = blobs)
    // useSnapshotsService().getPdfsForTab(tab.value.id)
    //     .then((blobs: SavedBlob[]) => pdfs.value = blobs)
    // useSnapshotsService().getBlobForTab(tab.value.id, BlobType.HTML)
    //   .then((blobs: SavedBlob[]) => htmls.value = blobs)
  }
})

function isOpen(tab: Tab | undefined): boolean {
  return TabsetService.isOpen(tab?.url || '')
}

const tabsetChips = (): object[] => {
  const badges: object[] = []
  const url = tab.value?.url
  if (url) {
    _.forEach(useTabsetService().tabsetsFor(url), (ts: string) =>
      badges.push({
        label: useTabsetService().nameForTabsetId(ts),
        tabsetId: ts,
        encodedUrl: btoa(url || ''),
      }),
    )
  }
  // if (hit.bookmarkId) {
  //   badges.push({
  //     label: 'bookmark',
  //     bookmarkId: hit.bookmarkId,
  //     encodedUrl: btoa(hit.url || '')
  //   })
  // }
  return badges
}

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

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

const showTabDetails = () =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL('/www/index.html#/mainpanel/tab/' + tab.value?.id)])

const updatedTags = (val: string[]) => {
  console.log('val', val)
  if (tab.value) {
    console.log('updating tag', val)
    tab.value.tags = val
    useTabsetService()
      .saveCurrentTabset()
      .catch((err) => console.error(err))
  }
}

const openTabset = (chip: any) => {
  console.log('chip', chip)
  useCommandExecutor().execute(new SelectTabsetCommand(chip['tabsetId']))
}

const openInJsonCrackEditor = (data: string) => {
  $q.dialog({
    title: 'Open in external Editor?',
    message: 'The current JSON-LD Data will be copied to your clipboard to be added by you to the external editor',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    navigator.clipboard.writeText(data).then(() => {
      useNavigationService().browserTabFor('https://jsoncrack.com/editor')
    })
  })
}

const linkingHeading = (data: object | undefined) => {
  if (!data) {
    return '---'
  }
  if (data['@type' as keyof object] === 'ItemList') {
    //console.log('data', typeof data, data)
    const items: object[] = (data['itemListElement' as keyof object] as object[]) || []
    //console.log('items', typeof items, items)
    if (items.map) {
      return items.map((o: object) => {
        const item = o['item' as keyof object]
        if (item['headline']) {
          return item['headline']
        }
        return item
      })
    } else {
      return '---'
    }
  }
  const part1: string = data['@type' as keyof object] || 'unknown'
  const part2: string = data['description' as keyof object] || ''
  return part1 + ', ' + part2
}

const openSearch = () => {
  useNavigationService().browserTabFor(
    'https://github.com/search?q={searchTerms}&amp;ref=opensearch'.replace('{searchTerms}', opensearchterm.value || ''),
  )
}
</script>
