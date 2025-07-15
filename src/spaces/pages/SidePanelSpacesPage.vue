<template>
  <!-- SidePanelSpacesPage -->
  <q-page style="padding-top: 84px">
    <div class="q-ma-none q-pa-none">
      <DocuMessageWidget
        v-if="sortedSpaces.length === 0 && showDocumentation"
        @hideDocumentation="showDocumentation = false">
        <template v-slot:header>
          <div class="text-h6">Too many Tabsets?</div>
          <div class="text-body1">Try <span class="text-bold">Spaces</span>!</div>
        </template>
        <template v-slot:message>
          <div class="q-col text-body1">
            <div class="row">
              <div class="col-1">
                <q-icon name="o_space_dashboard" color="primary" class="q-mb-xs" size="xs" />
              </div>
              <div class="col q-ml-sm text-body2">
                A Space is a collection of tabsets, and
                <span class="text-bold">each tabset can be assigned to multiple Spaces</span>.
              </div>
            </div>
            <div class="row q-mt-sm">
              <div class="col-1">
                <q-icon name="o_delete" color="primary" class="q-mb-xs" size="xs" />
              </div>
              <div class="col q-ml-sm text-body2">
                <span class="text-bold">Deleting</span> a Space does not delete any associated tabsets.
              </div>
            </div>
            <div class="row q-mt-sm">
              <div class="col-1">
                <q-icon name="o_settings" color="primary" class="q-mb-xs" size="xs" />
              </div>
              <div class="col q-ml-sm text-body2">
                Spaces can be deactivated in the <span class="text-bold">settings</span>.
              </div>
            </div>
          </div>
        </template>
      </DocuMessageWidget>

      <div v-if="sortedSpaces.length === 0 && showDocumentation" class="q-ma-md text-caption text-center">
        No Spaces yet
      </div>
      <div v-if="sortedSpaces.length === 0 && !showDocumentation" class="q-ma-md text-caption text-center">
        No Spaces yet
        <q-icon
          name="sym_o_help"
          color="accent"
          size="xs"
          @click="showDocumentation = true"
          class="cursor-pointer"></q-icon>
      </div>

      <q-list dense class="rounded-borders q-ma-none q-pa-none" :key="space.id" v-for="space in sortedSpaces">
        <q-expansion-item
          group="spacesGroup"
          header-class="q-ma-none q-pa-none q-pr-md"
          :header-style="headerStyle(space)"
          v-model="space.open"
          dense-toggle
          switch-toggle-side>
          <template v-slot:header>
            <SpaceHeader
              :key="randomKey"
              :caption="headerCaption(space.id)"
              :spaceLabel="space.label"
              :spaceOpen="space.open"
              :spaceId="space.id" />
          </template>

          <q-card>
            <q-card-section>
              <NavTabsetsListWidgetNonBex
                :tabsets="(tabsetsForSpaces.get(space.id) as Tabset[]) || []"
                :spaceId="space.id"
                :view-port="'sidepanel'" />
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>

      <q-list dense class="rounded-borders q-ma-none q-pa-none">
        <q-separator class="q-mb-md" v-if="sortedSpaces.length > 1 && tabsetsWithoutSpaces().length > 0" />

        <q-expansion-item
          dense
          v-if="useSpacesStore().spaces.size > 0 && tabsetsWithoutSpaces().length > 0"
          expand-separator
          label="Unassigned Tabsets"
          :caption="tabsetsWithoutSpaces().length + ' tabset(s)'">
          <q-card>
            <q-card-section>
              <NavTabsetsListWidgetNonBex
                :tabsets="tabsetsWithoutSpaces()"
                :fromPanel="true"
                :view-port="'sidepanel'" />
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <!--      <FirstToolbarHelper2-->
      <!--        @was-clicked="useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)"-->
      <!--        :show-back-button="true">-->
      <!--        <template v-slot:iconsRight>-->
      <!--          <div class="q-mt-sm q-ma-none q-qa-none q-pr-sm">-->
      <!--            <q-btn-->
      <!--              v-if="useSpacesStore().spaces.size > 0"-->
      <!--              icon="more_horiz"-->
      <!--              flat-->
      <!--              class="q-ma-none q-pa-xs q-mr-sm cursor-pointer"-->
      <!--              style="max-width: 20px"-->
      <!--              size="10px"-->
      <!--              @click="manageSpaces()">-->
      <!--              <q-tooltip class="tooltip">Manage Spaces</q-tooltip>-->
      <!--            </q-btn>-->

      <!--            <q-btn outline label="New Space" size="sm" @click="addSpace()" class="q-ma-none q-px-sm q-py-none" />-->
      <!--          </div>-->
      <!--        </template>-->
      <!--      </FirstToolbarHelper2>-->

      <ViewToolbarHelper title="My Tabsets">
        <template v-slot:iconsRight>
          <q-btn
            v-if="useSpacesStore().spaces.size > 0"
            icon="more_horiz"
            flat
            class="q-ma-none q-pa-xs q-mr-sm cursor-pointer"
            style="max-width: 20px"
            size="10px"
            @click="manageSpaces()">
            <q-tooltip class="tooltip">Manage Spaces</q-tooltip>
          </q-btn>
          <q-btn outline label="New Space" size="sm" @click="addSpace()" class="q-ma-sm q-mr-xs" />
        </template>
      </ViewToolbarHelper>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { uid, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import SpaceHeader from 'src/core/pages/sidepanel/helper/SpaceHeader.vue'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NewSpaceDialog from 'src/spaces/dialogues/NewSpaceDialog.vue'
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import NavTabsetsListWidgetNonBex from 'src/tabsets/widgets/NavTabsetsListWidgetNonBex.vue'
import DocuMessageWidget from 'src/ui/widgets/DocuMessageWidget.vue'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { inBexMode } = useUtils()

const $q = useQuasar()
const router = useRouter()
const spacesStore = useSpacesStore()

class OpenableSpace extends Space {
  open: boolean = false
}

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const tabsetName = ref<object>(null as unknown as object)
const tabsetNameOptions = ref<object[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tabsetsForSpaces = ref<Map<string, Tabset[]>>(new Map())
const sortedSpaces = ref<OpenableSpace[]>([])
const randomKey = ref<string>(uid())
const showDocumentation = ref(true)

function getSortedSpaces() {
  return [...spacesStore.spaces.values()]
    .map((s: Space) => {
      const openableSpace = new OpenableSpace(s.id, s.label)
      openableSpace.open = spacesStore.space?.id === s.id
      return openableSpace
    })
    .sort((a: OpenableSpace, b: OpenableSpace) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
}

const onMessageListener = async (message: any, sender: any, sendResponse: any) => {
  console.log(' <<< received message', message)
  if (message.name === 'reload-spaces') {
    const tsId = message.data.changedTabsetId
    await useTabsetService().reloadTabset(tsId)
    console.log('tsId', tsId)
    sortedSpaces.value = getSortedSpaces()
    tabsetsForSpaces.value = await getTabsetsForSpaces()
    randomKey.value = uid()
    //console.log("tabsetsForSpace", tabsetsForSpaces.value)
  }
}

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelSpacesPage', document.location.href)
  if (!useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    router.push('/sidepanel')
    return
  }

  if (inBexMode()) {
    //console.log("====> adding listener <====", chrome.runtime.onMessage.hasListeners())
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    chrome.runtime.onMessage.addListener(onMessageListener)
  }
})

onUnmounted(() => {
  // TODO unmount other listeners as well!
  //console.log("====> removing listener <====", chrome.runtime.onMessage.hasListener(onMessageListener))
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  chrome.runtime.onMessage.removeListener(onMessageListener)
  //console.log("====> removing listener <====", chrome.runtime.onMessage.hasListener(onMessageListener))
})

watchEffect(() => {
  sortedSpaces.value = getSortedSpaces()
})

async function getTabsetsForSpaces() {
  let res: Map<string, Tabset[]> = new Map()
  //console.log("===>", [...useTabsetsStore().tabsets.values()][0].spaces)
  _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
    if (ts.status !== TabsetStatus.DELETED) {
      _.forEach(ts.spaces, (spaceId: string) => {
        if (res.has(spaceId)) {
          const exisitingTabsets: Tabset[] = res.get(spaceId) || []
          if (exisitingTabsets.findIndex((t) => t.id === ts.id) < 0) {
            res.set(spaceId, (res.get(spaceId) || []).concat([ts]))
          }
        } else {
          res.set(spaceId, [ts])
        }
      })
    }
  })
  res.forEach((value: Tabset[], key: string) => {
    res.set(
      key,
      _.orderBy(
        value,
        [
          function (o: any) {
            return o.status.toString()
          },
          function (o: any) {
            return o.name.toLowerCase()
          },
        ],
        ['desc', 'asc'],
      ),
    )
  })
  // console.log("res", res)
  return res
}

watchEffect(() => {
  getTabsetsForSpaces().then((res: Map<string, Tabset[]>) => {
    tabsetsForSpaces.value = res
  })
})

watchEffect(() => {
  openTabs.value = useTabsStore2().browserTabs
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  const c1: chrome.tabs.Tab | undefined = useTabsStore2().getCurrentChromeTab(windowId)
  // const c2: chrome.tabs.Tab | undefined = useTabsStore2().getCurrentChromeTab
  currentChromeTab.value = c1 ? c1 : undefined
})

watchEffect(() => {
  if (useTabsetsStore().tabsets) {
    tabsetNameOptions.value = _.map([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
      return {
        label: ts.name,
        value: ts.id,
      }
    })
    if (tabsetNameOptions.value.length > 0) {
      tabsetName.value = tabsetNameOptions.value[0]!
    }
  }
})

if (inBexMode()) {
  let queryOptions = { active: true, lastFocusedWindow: true }
  chrome.tabs.query(queryOptions, (tab) => {
    currentChromeTabs.value = tab
  })
}

const tabsetsWithoutSpaces = (): Tabset[] => {
  let tabsets = [...useTabsetsStore().tabsets.values()]
  return _.sortBy(
    _.filter(
      tabsets,
      (ts: Tabset) =>
        ts.spaces.length === 0 &&
        ts.type !== TabsetType.SPECIAL &&
        ts.status !== TabsetStatus.ARCHIVED &&
        ts.status !== TabsetStatus.DELETED,
    ),
    [
      function (o: any) {
        return o.status === TabsetStatus.FAVORITE ? 0 : 1
      },
      function (o: any) {
        return o.name.toLowerCase()
      },
    ],
  )
}

const addSpace = async () => {
  const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
  $q.dialog({
    component: NewSpaceDialog,
    componentProps: {
      tabsetId: currentTabsetId,
      fromPanel: true,
    },
  })
}

const manageSpaces = () => {
  if ($q.platform.is.cordova || $q.platform.is.capacitor) {
    router.push('/spaces')
  } else {
    useNavigationService().browserTabFor(chrome.runtime.getURL('www/index.html#/mainpanel/spaces'))
  }
}

const headerStyle = (space: Space) => {
  let style = 'border:0 solid grey;border-top-left-radius:4px;border-top-right-radius:4px;' //tabsetExpanded.value.get(tabset.id) ?
  // style = style + 'border-left:4px solid #f5f5f5'
  return style
}

const headerCaption = (spaceId: string) => {
  return (tabsetsForSpaces.value.get(spaceId) || []).length + ' tabset(s)'
}
</script>
