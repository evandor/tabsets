<template>
  <div>
    <!--    <div class="row items-baseline q-mx-md q-pa-none">-->
    <!--      <div class="col-12 q-mb-md">&nbsp;-->
    <!--        <q-banner v-if="useUiStore().getSelectedTab?.isDuplicate"-->
    <!--                  rounded class="bg-amber-1 text-black">This tab has duplicates in this tabset-->
    <!--        </q-banner>-->
    <!--      </div>-->
    <!--    </div>-->

    <div class="row items-baseline q-mx-sm q-my-sm">

      <div class="col-2">
        <TabFaviconWidget
          class="q-mr-md q-mb-md"
          :tab="uiStore.getSelectedTab" width="24ps" height="24px"/>
      </div>
      <div class="col-10 text-body1 ellipsis">
        {{ getHost(useUiStore().getSelectedTab?.chromeTab?.url, true) }}
      </div>
      <div class="col-12 text-body2 ellipsis">
        {{ useUiStore().getSelectedTab?.chromeTab?.title }}
      </div>

      <div class="col-12">
        <div class="text-overline ellipsis text-blue-10 cursor-pointer"
             @click.stop="NavigationService.openOrCreateTab(useUiStore().getSelectedTab.chromeTab?.url )">
          {{ useUiStore().getSelectedTab?.chromeTab?.url }}&nbsp;<q-icon name="launch" color="secondary"
                                                                         class="cursor-pointer"></q-icon>
        </div>
      </div>

    </div>

    <div class="row q-ma-sm">
      <div class="col-5 text-caption text-bold">
        In tabsets:
      </div>
      <div class="col-7 text-right">
        <q-chip v-for="chip in tabsetChips()"
                class="cursor-pointer q-ml-xs" size="8px" clickable icon="tab" @click="openTabset(chip)">
          {{ chip.label }}
        </q-chip>
      </div>
    </div>

    <div class="row q-ma-sm">
      <div class="col-5 text-caption text-bold">
        In Bookmarks:
      </div>
      <div class="col-7 text-right">
        ...
      </div>
    </div>

    <div class="row q-ma-sm">

      <div class="col-12" v-if="hasAllUrlsPermission">
        <q-img :src="thumbnail" style="border:1px dotted grey;border-radius: 5px;" no-native-menu/>
      </div>
      <div class="col-12" v-else-if="!inBexMode()">
        <q-img src="thumbnail-not-available.png" style="border:1px solid grey;border-radius: 5px;" no-native-menu/>
      </div>
      <div class="col-12" v-else>
        <q-banner rounded class="bg-yellow-1 text-black" style="border:1px solid grey;border-radius: 5px;">
          If you want to have thumbnails of your tabs, additional permissions are needed.<br><br>
          Click <span class="cursor-pointer text-blue-6" style="text-decoration: underline"
                      @click="router.push('/features/thumbnails')">here</span> to
          grant permissions for the tabset extension to create thumbnails for your tabs.
        </q-banner>
      </div>

      <div class="col-3 text-left">


        <q-btn v-if="featuresStore.isEnabled('dev')"
               @click="showTabDetails"
               round size="11px"
               color="primary"
               flat
               icon="o_more_horiz">
          <q-tooltip>Show additional information about this tab (developer mode)</q-tooltip>
        </q-btn>
      </div>
      <div class="col-9 text-right">
        <!--        <q-btn round size="11px"-->
        <!--               :color="useUiStore().getSelectedTab?.note && useUiStore().getSelectedTab.note.length > 0 ? 'white' : 'warning'"-->
        <!--               :style="useUiStore().getSelectedTab?.note && useUiStore().getSelectedTab.note.length > 0 ? 'background: #FFBF46' : 'background: #ffffff'"-->
        <!--               flat-->
        <!--               icon="edit_note"-->
        <!--               @click.stop="editNoteDialog(useUiStore().getSelectedTab)">-->
        <!--          <q-tooltip>Add a note to this tab or edit it</q-tooltip>-->
        <!--        </q-btn>-->

        <q-btn flat round color="primary" size="11px" icon="o_schedule" @click.stop="scheduleTab()">
          <q-tooltip>Schedule this tab</q-tooltip>
        </q-btn>

        <q-btn v-if="usePermissionsStore().hasPermission('pageCapture')"
               @click.stop="saveTab(useUiStore().getSelectedTab)"
               flat round color="primary" size="11px" icon="save"
               :disabled="!isOpen(useUiStore().getSelectedTab)">
          <q-tooltip v-if="isOpen(useUiStore().getSelectedTab)">Save this tab</q-tooltip>
          <q-tooltip v-else>The tab must be open if you want to save it. Click on the link and come back here to save
            it.
          </q-tooltip>
        </q-btn>


      </div>

    </div>



    <div class="row q-mx-md q-mt-lg">
      <div class="col-12 text-caption text-bold">Note</div>
    </div>
    <div class="row q-mx-md">
      <div class="col-12 text-caption">{{ useUiStore().getSelectedTab.note }}</div>
    </div>


  </div>

  <q-list bordered>
    <q-expansion-item
      group="somegroup"
      label="Meta Data"
      default-opened>
      <q-card>
        <q-card-section>
          <div class="row q-mx-md q-mt-lg">
            <div class="col-5 text-caption text-bold">created</div>
            <div class="col-7 text-right text-caption">{{ formatDate(useUiStore().getSelectedTab.created) }}</div>
          </div>
          <div class="row q-mx-md">
            <div class="col-5 text-caption text-bold">changed</div>
            <div class="col-7 text-right text-caption">{{ formatDate(useUiStore().getSelectedTab.changed) }}</div>
          </div>
          <div class="row q-mx-md">
            <div class="col-5 text-caption text-bold">last active</div>
            <div class="col-7 text-right text-caption">{{ formatDate(useUiStore().getSelectedTab.lastActive) }}</div>
          </div>
          <div class="row q-mx-md">
            <div class="col-5 text-caption text-bold">opened</div>
            <div class="col-7 text-right text-caption">{{ useUiStore().getSelectedTab.activatedCount }}x</div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-separator/>

    <q-expansion-item group="somegroup" label="Search Index">
      <q-card>
        <q-card-section>
          <div class="row q-mx-md q-mt-lg">
            <div class="col-12 text-caption text-bold q-mb-sm">Search Index</div>
          </div>
          <div class="row q-mx-md">
            <div class="col-12 text-caption">
              <div v-for="(k,index) in searchIndex">
                <div class="row" v-if="searchIndex.get(index)['v']">
                  <div class="col-4 q-ml-sm">
                    {{ searchIndex.get(index)['name'] }}
                  </div>
                  <div class="col-7 ellipsis">
                    {{ searchIndex.get(index)['v'] }}
                    <q-tooltip class="tooltip">{{ searchIndex.get(index)['v'] }}</q-tooltip>
                  </div>
                  <div class="col text-right">
                    <q-icon name="o_check_circle" color="primary"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-separator/>

    <q-expansion-item v-if="useFeatureTogglesStore().isEnabled('dev')"
                      group="somegroup" label="Debug">
      <q-card>
        <q-card-section>
          #{{ useUiStore().getSelectedTab?.id }}
        </q-card-section>
        <q-card-section>
          <vue-json-pretty style="font-size: 80%"
                           v-model:data="state.data"
                           :show-double-quotes="true"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-separator/>

  </q-list>

</template>

<script lang="ts" setup>

import {useUiStore} from "src/stores/uiStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import _ from "lodash";
import {useTabsetService} from "src/services/TabsetService2";
import TabsetService from "src/services/TabsetService";
import {reactive, ref, watchEffect} from "vue";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {Tab} from "src/models/Tab";
import {formatDistance} from "date-fns";
import {useUtils} from "src/services/Utils";
import NavigationService from "src/services/NavigationService";
import {useSearchStore} from "stores/searchStore";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';
import {useCommandExecutor} from "src/services/CommandExecutor";
import {SaveTabCommand} from "src/domain/tabs/SaveTab";

const {inBexMode} = useUtils()

const uiStore = useUiStore()
const featuresStore = useFeatureTogglesStore()
const router = useRouter()
const $q = useQuasar()

const hasAllUrlsPermission = ref<boolean | undefined>(false)

watchEffect(() => hasAllUrlsPermission.value = usePermissionsStore().hasAllOrigins())

const thumbnail = ref('')
const content = ref('')
const searchIndex = ref<any>()
const {selectTabset} = useTabsetService()

const json = ref(null)

const state = reactive({
  val: JSON.stringify(json),
  data: json
})

watchEffect(() => {
  if (useUiStore().getSelectedTab) {
    json.value = JSON.parse(JSON.stringify(useUiStore().getSelectedTab))
  }
})


watchEffect(() => hasAllUrlsPermission.value = usePermissionsStore().hasAllOrigins())

watchEffect(() => {
  if (uiStore.getSelectedTab) {
    TabsetService.getThumbnailFor(uiStore.getSelectedTab)
      .then(data => {
        if (data) {
          thumbnail.value = data.thumbnail
        } else {
          thumbnail.value = ''
        }
      })
    TabsetService.getContentFor(uiStore.getSelectedTab)
      .then(data => {
        if (data) {
          content.value = data.content
        }
      })
  }
})

function isOpen(tab: Tab): boolean {
  return TabsetService.isOpen(tab?.chromeTab?.url || '')
}

const tabsetChips = (): object[] => {
  const badges: object[] = []
  const url = uiStore.getSelectedTab?.chromeTab.url
  if (url) {
    _.forEach(useTabsetService().tabsetsFor(url), ts => badges.push({
      label: TabsetService.nameForTabsetId(ts),
      tabsetId: ts,
      encodedUrl: btoa(url || '')
    }))
  }
  // if (hit.bookmarkId) {
  //   badges.push({
  //     label: 'bookmark',
  //     bookmarkId: hit.bookmarkId,
  //     encodedUrl: btoa(hit.chromeTab.url || '')
  //   })
  // }
  return badges;
}

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

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

const showTabDetails = () => router.push("/tab/" + uiStore.getSelectedTab?.id)

watchEffect(() => {
  const fuseIndex = useSearchStore().getIndex()
  // keys.value = fuseIndex['keys' as keyof object]
  const keyMaps = fuseIndex['_keysMap' as keyof object]
  const res = _.filter(fuseIndex['records' as keyof object], (r: any) => {
    return useUiStore().getSelectedTab?.chromeTab.url === r.$[2]?.v
  })
  const keys: Map<number, object> = new Map()
  Object.keys(keyMaps).forEach((k: any) => {
    keys.set(keyMaps[k], {
      name: k
    })
  })

  if (res && res.length > 0) {
    Object.keys(res[0]['$' as keyof object]).forEach(k => {
      const tmp = res[0]['$' as keyof object][k as keyof object]
      const v: any = keys.get(+k)
      v.n = tmp['n' as keyof object]
      const c = tmp['v' as keyof object]
      v.v = c //? (c.length > 100 ? c.substring(0,98) + "..." : c) : ''
      keys.set(+k, v)
    })
    searchIndex.value = keys
  }
})

const saveTab = (tab: Tab) => useCommandExecutor().execute(new SaveTabCommand(tab))


</script>
