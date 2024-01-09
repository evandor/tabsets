<template>

  <q-footer class="bg-white q-pa-xs q-mt-sm" style="border-top: 1px solid lightgrey">
    <div class="row fit q-mb-sm" v-if="showWindowTable">
      <div class="col-12 text-right">
        <Transition name="bounceInLeft" appear>
          <q-table
            flat dense
            :rows="rows"
            :columns="columns"
            row-key="id"
            hide-bottom
            binary-state-sort>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="windowIcon" :props="props">
                  <q-icon name="edit"/>
                </q-td>
                <q-td key="name" :props="props">
                  {{ props.row.name }}
                  <q-popup-edit v-model="props.row.name" v-slot="scope">
                    <q-input v-model="scope.value" dense autofocus counter
                             @update:model-value="val => setWindowName(props.row.id, val)"
                             @keyup.enter="scope.set"/>
                  </q-popup-edit>
                </q-td>
                <!--            <q-td key="windowHeight" :props="props">-->
                <!--              {{ props.row.windowHeight }}-->
                <!--              <q-popup-edit v-model="props.row.windowHeight" title="Update windowHeight" buttons v-slot="scope">-->
                <!--                <q-input type="number" v-model="scope.value" dense autofocus/>-->
                <!--              </q-popup-edit>-->
                <!--            </q-td>-->
                <!--            <q-td key="windowWidth" :props="props">-->
                <!--              {{ props.row.windowWidth }}-->
                <!--              <q-popup-edit v-model="props.row.windowWidth" title="Update windowWidth" buttons v-slot="scope">-->
                <!--                <q-input type="number" v-model="scope.value" dense autofocus/>-->
                <!--              </q-popup-edit>-->
                <!--            </q-td>-->
                <q-td key="windowAction" :props="props">
              <span
                :class="useWindowsStore().currentWindow?.id === props.row.id ? 'text-grey' : 'text-blue-8 cursor-pointer'"
                @click="openWindow(props.row.id)">open</span>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </Transition>

      </div>
    </div>
    <!--    <div class="row fit q-mb-sm"-->
    <!--         style="border-bottom: 1px dotted #bfbfbf"-->
    <!--         v-if="otherActiveWindows().length > 0">-->
    <!--      <div class="col-7 text-black">-->
    <!--        <q-icon name="o_grid_view" color="blue">-->
    <!--          <q-tooltip class="tooltip-small">Current Browser Window</q-tooltip>-->
    <!--        </q-icon>-->
    <!--        <span class="q-mx-md cursor-pointer text-subtitle2 ellipsis">{{ currentWindowName }}</span>-->
    <!--        <q-popup-edit :model-value="currentWindowName" v-slot="scope"-->
    <!--                      @update:model-value="val => setNewName(val)">-->
    <!--          <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set"/>-->
    <!--        </q-popup-edit>-->
    <!--        <q-tooltip class="tooltip-small">Rename window '{{ currentWindowName }}'</q-tooltip>-->


    <!--      </div>-->
    <!--      <div class="col text-black text-right">-->
    <!--        <template v-if="!showWindowTable">-->
    <!--          <span class="text-black cursor-pointer text-subtitle2">Switch Window</span>-->
    <!--          <q-menu fit anchor="top middle" self="bottom middle">-->
    <!--            <q-item clickable dense v-for="w in otherActiveWindows()" @click="openWindow(w.id)" v-close-popup>-->
    <!--              <q-item-section>{{ w.name }}</q-item-section>-->
    <!--            </q-item>-->
    <!--          </q-menu>-->
    <!--          <q-icon name="edit" class="q-mx-sm cursor-pointer" color="primary" @click="toggleShowWindowTable()">-->
    <!--            <q-tooltip class="tooltip-small">Edit Window Names</q-tooltip>-->
    <!--          </q-icon>-->

    <!--        </template>-->
    <!--        <template v-else>-->
    <!--          <q-icon name="edit" class="q-mx-sm q-ma-none cursor-pointer" color="primary"-->
    <!--                  @click="toggleShowWindowTable()"/>-->
    <!--        </template>-->
    <!--      </div>-->

    <!--    </div>-->
    <div class="row fit">
      <div class="col-9">

        <Transition name="fade" appear>
          <q-banner
            v-if="checkToasts()"
            inline-actions dense rounded
            style="font-size: smaller;text-align: center"
            :class="toastBannerClass()">
            {{ useUiStore().toasts[0]?.msg }}
            <template v-slot:action v-if="useUiStore().toasts[0]?.action">
              <q-btn flat label="Undo"
                     @click="useUiStore().callUndoActionFromCurrentToast()"/>
            </template>
          </q-banner>
        </Transition>

        <q-btn v-if="!checkToasts() && !transitionGraceTime && showSuggestionButton"
               outline
               icon="o_lightbulb"
               :label="suggestionsLabel()"
               :color="dependingOnStates()"
               :size="getButtonSize()"
               @click="suggestionDialog()"
               class="q-ma-none q-pa-xs q-ml-sm q-mt-xs q-pr-md cursor-pointer">
        </q-btn>

        <template v-if="!checkToasts() && !transitionGraceTime && !showSuggestionButton">

          <SidePanelFooterLeftButtons
            @was-clicked="doShowSuggestionButton = true"
            :show-suggestion-icon="showSuggestionIcon"/>

        </template>

        <template v-if="progress">
          <q-linear-progress size="20px" :value="progress" color="primary">
            <div class="absolute-full flex flex-center">
              <q-badge color="white" text-color="accent" :label="progressLabel"/>
            </div>
          </q-linear-progress>
        </template>
        <template v-else>
          <!--          <q-input borderless v-if="!progress && usePermissionsStore().hasFeature(FeatureIdent.NOTES)"-->
          <!--                   class="q-ma-xs"-->
          <!--                   style="height:20px;border: 1px dotted lightgray; border-radius: 3px;" v-model="dragTarget"/>-->
        </template>

      </div>
      <div class="col text-right text-black">
        <q-btn icon="o_help" v-if="usePermissionsStore().hasFeature(FeatureIdent.HELP)"
               :class="rightButtonClass()"
               flat
               color="black"
               :size="getButtonSize()"
               @click="openHelpView()">
        </q-btn>

        <q-btn icon="o_settings"
               :class="rightButtonClass()"
               flat
               color="black"
               :size="getButtonSize()"
               @click="openOptionsPage()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">{{ settingsTooltip() }}</q-tooltip>
        </q-btn>

        <q-btn v-if="useWindowsStore().currentWindows.length > 1"
               icon="o_grid_view"
               :class="rightButtonClass()"
               flat
               color="black"
               :size="getButtonSize()"
               @click="toggleShowWindowTable()">
          <q-tooltip class="tooltip" anchor="top left" self="bottom left">Manage Windows</q-tooltip>
        </q-btn>

        <q-btn
          v-if="usePermissionsStore().hasFeature(FeatureIdent.STANDALONE_APP)"
          icon="o_open_in_new"
          :class="rightButtonClass()"
          flat
          color="black"
          :size="getButtonSize()"
          @click="openExtensionTab()">
          <q-tooltip class="tooltip">Tabsets as full-page app</q-tooltip>
        </q-btn>

      </div>
    </div>

  </q-footer>
</template>
<script setup lang="ts">
import {SidePanelView, useUiStore} from "src/stores/uiStore";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import {ref, watch, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import NavigationService from "src/services/NavigationService";
import {openURL, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useWindowsStore} from "src/stores/windowsStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import _ from "lodash";
import {SuggestionState} from "src/models/Suggestion";
import SuggestionDialog from "components/dialogues/SuggestionDialog.vue";
import {TabsetStatus} from "src/models/Tabset";
import {ToastType} from "src/models/Toast";
import SidePanelFooterLeftButtons from "components/helper/SidePanelFooterLeftButtons.vue";

const {inBexMode} = useUtils()

const $q = useQuasar()

const router = useRouter()
const uiStore = useUiStore()

const currentChromeTabs = ref<chrome.tabs.Tab[]>([])
const currentTabs = ref<Tab[]>([])
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const progress = ref<number | undefined>(undefined)
const progressLabel = ref<string | undefined>(undefined)
const showSuggestionButton = ref(false)
const showSuggestionIcon = ref(false)
const doShowSuggestionButton = ref(false)
const transitionGraceTime = ref(false)
const showWindowTable = ref(false)
const currentWindowName = ref('---')

const columns = [
  //{name: 'windowIcon', align: 'center', label: '', field: 'windowIcon', sortable: true},
  {
    name: 'name',
    required: true,
    label: 'Window Name (editable)',
    align: 'left',
    sortable: false
  },
  // {name: 'windowHeight', align: 'center', label: 'Height', field: 'windowHeight'},
  // {name: 'windowWidth', align: 'center', label: 'Height', field: 'windowWidth'},
  {name: 'windowAction', align: 'center', label: 'Action', field: 'windowAction', sortable: false}
]

const rows = ref<object[]>([])

watchEffect(() => {
  if (useWindowsStore().currentWindows.length === 1) {
    showWindowTable.value = false
  }
})

watchEffect(() => {
  const suggestions = useSuggestionsStore().getSuggestions(
    [SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.NOTIFICATION])
  //console.log("watcheffect for", suggestions)
  showSuggestionButton.value =
    doShowSuggestionButton.value ||
    (useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
      _.findIndex(suggestions, s => {
        return s.state === SuggestionState.NEW ||
          (s.state === SuggestionState.NOTIFICATION && !usePermissionsStore().hasFeature(FeatureIdent.NOTIFICATIONS))
      }) >= 0)

  showSuggestionIcon.value =
    !doShowSuggestionButton.value &&
    useUiStore().sidePanelActiveViewIs(SidePanelView.MAIN) &&
    _.findIndex(suggestions, s => {
      return s.state === SuggestionState.DECISION_DELAYED
    }) >= 0
})

watchEffect(() => {
  if (currentChromeTabs.value[0]?.url) {
    currentTabs.value = useTabsStore().tabsForUrl(currentChromeTabs.value[0].url) || []
  }
})

watchEffect(() => {
  if (!inBexMode()) {
    return
  }
  const windowId = useWindowsStore().currentWindow?.id || 0
  currentChromeTab.value = useTabsStore().getCurrentChromeTab(windowId) || useTabsStore().currentChromeTab
})

watchEffect(() => {
  progress.value = (uiStore.progress || 0.0) / 100.0
  progressLabel.value = uiStore.progressLabel + " " + Math.round(100 * progress.value) + "%"
})

//const openOptionsPage = () => window.open(chrome.runtime.getURL('www/index.html#/mainpanel/settings'));
//const openOptionsPage = () => window.open('#/mainpanel/settings');
const openOptionsPage = () => NavigationService.openOrCreateTab([chrome.runtime.getURL('www/index.html#/mainpanel/settings')], undefined, [], false, true)

const openExtensionTab = () =>
  //NavigationService.openOrCreateTab([chrome.runtime.getURL('www/index.html#/fullpage')])
  openURL(chrome.runtime.getURL('www/index.html#/fullpage'))

const settingsTooltip = () => {
  return "Open Settings of Tabsets " + import.meta.env.PACKAGE_VERSION
}

const rightButtonClass = () => "q-my-xs q-px-xs q-mr-none"

const dependingOnStates = () =>
  _.find(useSuggestionsStore().getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED]), s => s.state === SuggestionState.NEW) ? 'warning' : 'primary'

const suggestionDialog = () => {
  doShowSuggestionButton.value = false
  $q.dialog({
    component: SuggestionDialog, componentProps: {
      suggestion: useSuggestionsStore()
        .getSuggestions([SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.NOTIFICATION]).at(0),
      fromPanel: true
    }
  })
}
const suggestionsLabel = () => {
  const suggestions = useSuggestionsStore().getSuggestions(
    [SuggestionState.NEW, SuggestionState.DECISION_DELAYED, SuggestionState.NOTIFICATION])
  return suggestions.length === 1 ?
    suggestions.length + " New Suggestion" :
    suggestions.length + " New Suggestions"

}

const openHelpView = () => {
  const helpTabset = useTabsStore().getTabset("HELP")
  console.log("got helpTabset", helpTabset)
  if (helpTabset && helpTabset.status !== TabsetStatus.DELETED) {
    router.push("/sidepanel/tabsets/HELP")
  } else {
    //deactivateHelpFeature();
  }
}

const checkToasts = () => {
  if (useUiStore().toasts.length > 0) {
    const useDelay = 3000
    useUiStore().delayedToastRemoval(useDelay)
    const oldShowButton = showSuggestionButton.value
    const oldDoShowButton = doShowSuggestionButton.value
    transitionGraceTime.value = true
    showSuggestionButton.value = false
    doShowSuggestionButton.value = false
    setTimeout(() => {
      if (useUiStore().toasts.length === 0) { // only if all toasts are gone
        transitionGraceTime.value = false
        showSuggestionButton.value = oldShowButton
        doShowSuggestionButton.value = oldDoShowButton
      }
    }, useDelay + 1100) // must be higher than css value in fade-leave-active

    return true
  }
  return false
}

const getButtonSize = () => useUiStore().getButtonSize('sidePanelFooter')

const toastBannerClass = () => {
  const defaults = " text-white q-py-none"
  switch (useUiStore().toasts[0]?.type) {
    case ToastType.INFO:
      return "bg-positive" + defaults
    case ToastType.WARNING:
      return "bg-warning" + defaults
    case ToastType.ERROR:
      return "bg-negative" + defaults
    default:
      return "bg-negative" + defaults
  }
}

const otherActiveWindows = () => {
  return _.filter(
    _.sortBy(
      _.map(
        _.filter(useWindowsStore().currentWindows, (w: chrome.windows.Window) => {
          return useWindowsStore().currentWindow?.id !== w.id
        }), w => {
          return w.id ? {
            name: useWindowsStore().windowNameFor(w.id) || 'Main',
            id: w.id
          } : {name: 'unknown', id: 0}
        }),
      o => o.name),
    (e: object) => e['name' as keyof object] !== '%monitoring%')
}

watchEffect(() => {
  const res = useWindowsStore().currentWindow && useWindowsStore().currentWindow.id ?
    useWindowsStore().windowNameFor(useWindowsStore().currentWindow.id || 0) || 'n/a' :
    'n/a'
  currentWindowName.value = res
})

const setNewName = (newName: string) => {
  //console.log("setting window name to ", newName)
  if (newName.trim().length > 0) {
    currentWindowName.value = newName
    //console.log("setting window name to ", currentWindowName.value)
    useWindowsStore().currentWindowName = newName
    chrome.windows.getCurrent((w) => {
      useWindowsStore().upsertWindow(w, newName, "")
    })
  }
}

const openWindow = (windowId: number) => {
  if (useWindowsStore().currentWindow?.id !== windowId) {
    chrome.windows.update(windowId, {drawAttention: true, focused: true},
      (callback) => {
      })
  }
}

const toggleShowWindowTable = () => {
  showWindowTable.value = !showWindowTable.value
  if (showWindowTable.value) {

    rows.value = _.map(useWindowsStore().currentWindows as chrome.windows.Window[], (w: chrome.windows.Window) => {
      return {
        id: w.id,
        name: useWindowsStore().windowNameFor(w.id || 0) || w.id,
        windowHeight: w['height' as keyof object],
        windowWidth: w['width' as keyof object],
        windowIcon: "*"
      }
    })
  }
}

const setWindowName = (id: number, newName: String) => {
  console.log("herie", id, newName)
  if (newName && newName.toString().trim().length > 0) {
    chrome.windows.get(id, (cw) => {
      //console.log("setting window name", id, newName.toString().trim())
      useWindowsStore().upsertWindow(cw, newName.toString().trim(), "")

      if (useWindowsStore().currentWindow?.id === id) {
        currentWindowName.value = newName
        //console.log("setting window name to ", currentWindowName.value)
        useWindowsStore().currentWindowName = newName
      }
    })
  }

}

</script>

<style>
.fade-enter-active {
  transition: opacity 0.5s ease;
}

.fade-leave-active {
  transition: opacity 1.0s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
