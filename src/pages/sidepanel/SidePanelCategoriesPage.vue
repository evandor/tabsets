<template>

  <q-page style="padding-top: 45px">

    <!-- list of tabs, assuming here we have at least one tabset -->
    <div class="q-ma-none">

      <div class="q-ma-none q-pa-none">
        <q-list dense
                class="rounded-borders q-ma-none q-pa-none" v-for="category in publicCategories">
          <q-expansion-item
            :header-class="tabsStore.currentTabsetId === category.id ? 'bg-grey-4':''"
            header-class="q-ma-none q-px-sm"
            group="publicCategories"
            v-model="tabsetExpanded[category.id]"
            expand-separator
            hide-expand-icon
            :label="category.name"
            :caption="tabsetCaption(category as Tabset)">

            <template v-slot:header>
              <q-item-section
                @mouseover="hoveredTabset = category.id"
                @mouseleave="hoveredTabset = undefined">
                <q-item-label :class="tabsStore.currentTabsetId === category.id ? 'text-bold text-primary' : ''">
                  {{ category.name }}
                </q-item-label>
                <q-item-label class="text-caption text-grey-5">
                  {{ tabsetCaption(category as Tabset) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side
                              @mouseover="hoveredTabset = category.id"
                              @mouseleave="hoveredTabset = undefined">
                <Transition appear>
                  <div class="row items-center">
                    <span v-if="hoveredOver(category.id)">
                      <q-icon name="more_horiz" color="primary" size="16px"/>
                    </span>
                    <span v-else>
                      <q-icon color="primary" size="16px"/>
                    </span>
                    <q-menu :offset="[10, -5]">
                      <q-list dense style="min-width: 200px">

                        <q-item clickable v-close-popup @click.stop="copyTabset(category as Tabset)">
                          <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
                            <q-icon size="xs" name="o_tab" color="accent"/>
                          </q-item-section>
                          <q-item-section>
                            Copy Category to my Tabsets
                          </q-item-section>
                        </q-item>

                      </q-list>
                    </q-menu>
                  </div>

                </Transition>
              </q-item-section>
            </template>

            <PanelTabList :tabs="category.tabs" :hideMenu="true" type="categories" />

          </q-expansion-item>


        </q-list>
      </div>


    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">
      <FirstToolbarHelper title="Public Tabsets" :forceTitle="true"/>
    </q-page-sticky>

  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash"
import {Tabset, TabsetType} from "src/models/Tabset";
import {useRoute, useRouter} from "vue-router";
import {useUtils} from "src/services/Utils";
import {useQuasar} from "quasar";
import {useTabsetService} from "src/services/TabsetService2";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {SidePanelView, useUiStore} from "stores/uiStore";
import PanelTabList from "components/layouts/PanelTabList.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {useSpacesStore} from "stores/spacesStore";
import SidePanelDynamicTabset from "components/layouts/sidepanel/SidePanelDynamicTabset.vue";
import {useLogsStore} from "stores/logsStore";
import SidePanelTabInfo from "pages/sidepanel/SidePanelTabInfo.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {useCategoriesStore} from "stores/categoriesStore";
import {useDB} from "src/services/usePersistenceService";
import {CopyFromPublicCategory} from "src/domain/categories/CopyFromPublicCategory";

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const tabsStore = useTabsStore()
const spacesStore = useSpacesStore()
const categoriesStore = useCategoriesStore()
const uiStore = useUiStore()
const show = ref(false)

const publicCategories = ref<Tabset[]>([])
const openTabs = ref<chrome.tabs.Tab[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab>(null as unknown as chrome.tabs.Tab)
const tabsetExpanded = ref<object>({})
const hoveredTabset = ref<string | undefined>(undefined)


const selectedTab = ref<Tab | undefined>(undefined)

onMounted(() => {
  useCategoriesStore().initialize(useDB(undefined).db)
})

watchEffect(() => {
  const cats = categoriesStore.categories
  const catsAsTabsets: Tabset[] = []
  cats.forEach(c => {
    if (c.id !== 'adult') {
      catsAsTabsets.push(new Tabset(c.id, c.label, c.tabs))
    }
  })
  publicCategories.value = catsAsTabsets
})

watchEffect(() => {
  selectedTab.value = useUiStore().getSelectedTab
  if (selectedTab.value) {
    currentChromeTab.value = null as unknown as chrome.tabs.Tab
  }
})

watchEffect(() => {
  openTabs.value = useTabsStore().tabs
  currentTabset.value = useTabsStore().getCurrentTabset
})

watchEffect(() => {
  currentChromeTab.value = useTabsStore().currentChromeTab
})

const tabsetCaption = (tabset: Tabset) => tabset.tabs?.length.toString() + ' tab' + (tabset.tabs?.length === 1 ? '' : 's')

const hoveredOver = (tabsetId: string) => hoveredTabset.value === tabsetId


const copyTabset = (category: Tabset) => useCommandExecutor().executeFromUi(new CopyFromPublicCategory(category))


</script>

<style scoped>

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
