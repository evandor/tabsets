<template>
  <div class="q-ma-none q-pa-none" style="max-width:300px">
    <q-list>
      <q-expansion-item v-for="(tabset,index) in tabsets" group="thegroup"
                        dense-toggle dense hide-expand-icon
                        v-model="expanded[index]"
                        class="darken-on-hover"
                        :style="activeTabset === tabset.id ? 'background-color: #efefef' : 'background-color:#f9f9f9'"
                        header-class="q-ma-none q-pa-none q-ml-md q-mb-xs"
                        :expand-icon="activeTabset === tabset.id ? 'expand_more' : 'none'"
                        expand-icon-toggle>

        <template v-slot:header>
          <q-item-section class="cursor-pointer q-ma-none q-pa-none"
                          @drop="onDrop($event, tabset.id)"
                          @dragover.prevent
                          @dragenter.prevent
                          :class="activeTabset === tabset.id ? 'active-list-element' : ''"
                          @click="selectTS(tabset)">
            <q-item-label>
              <template v-slot>

                <div class="row">
                  <div class="col-10 ellipsis">
                    <q-icon name="stars" color="warning" class="q-ml-none q-mr-sm"
                            v-if="tabset.status === TabsetStatus.FAVORITE">
                      <q-tooltip class="tooltip">This tabset is marked as 'favorite'</q-tooltip>
                    </q-icon>
                    <q-icon name="explore" color="primary" class="q-ml-none q-mr-sm"
                            v-if="tabset.type === TabsetType.SESSION">
                      <q-tooltip>This is a 'session' tabset, keeping track of your tabs automatically</q-tooltip>
                    </q-icon>
                    <q-icon name="share" color="primary" class="q-ml-none q-mr-sm"
                            v-if="tabset.sharedBy">
                      <q-tooltip>This tabset is shared by {{ tabset.sharedBy }}</q-tooltip>
                    </q-icon>
                    <q-icon name="build_circle" color="primary" class="q-ml-none q-mr-sm"
                            v-if="tabset.type === TabsetType.DYNAMIC">
                      <q-tooltip class="tooltip">The tabs of this tabset have been generated automatically</q-tooltip>
                    </q-icon>
                    <!--                    <q-icon name="local_library" color="blue-10" class="q-ml-none q-mr-sm"-->
                    <!--                            style="position:relative;top:-5px;left:-2px;"-->
                    <!--                            v-if="tabset.type === TabsetType.DYNAMIC">-->
                    <!--                      <q-tooltip class="tooltip">This tabset is readonly</q-tooltip>-->
                    <!--                    </q-icon>-->
                    {{ tabset.name }}
                  </div>
                </div>


                <!-- !MIT -->

              </template>
            </q-item-label>

          </q-item-section>
          <q-item-section class="text-right q-mx-sm cursor-pointer"
                          @mouseover="hoveredTab = tabset.id"
                          @mouseleave="hoveredTab = undefined"
                          style="max-width:25px;font-size: 12px;color:#bfbfbf">
            <span v-if="hoveredOver(tabset.id)">
              <q-icon name="more_horiz" color="primary" size="16px"/>
            </span>
            <span v-else-if="tabset.type === TabsetType.DYNAMIC">
              -
            </span>
            <span v-else>
                {{ tabset.tabs.length }}
            </span>

            <TabsetListContextMenu
              :tabset="tabset"
              :index="index"
              :hoveredTab="hoveredTab"
              :in-side-panel="props.fromPanel"
              @toggleExpand="(index:number) => toggleExpand(index)"/>

          </q-item-section>
        </template>

        <div v-for="tab in tabset.tabs">
          <q-card flat class="q-mt-none q-ml-lg q-mb-sm q-pa-none" style="max-width:260px">
            <q-card-section class="q-ma-none q-pa-none">
              <div class="row items-baseline cursor-pointer" @click.stop="open(tab)">
                <div class="col-1">
                  <TabFaviconWidget height="12px" width="12px" :tab="tab"/>
                </div>
                <div class="col-10 ellipsis">
                  {{ tab.chromeTab.title }}
                  <q-tooltip class="tooltip">{{ tab.chromeTab.url }}</q-tooltip>
                </div>
                <div class="col-1">
                  <q-icon
                    @click="deleteTab(tab)"
                    name="o_delete" color="grey-5">
                    <q-tooltip class="tooltip">Delete this tab from this tabset</q-tooltip>
                  </q-icon>
                </div>
              </div>

            </q-card-section>
          </q-card>
        </div>

      </q-expansion-item>

    </q-list>
  </div>

</template>

<script lang="ts" setup>

import {onMounted, PropType, ref, watchEffect} from "vue";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {openURL, useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useSpacesStore} from "src/stores/spacesStore";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useTabsetService} from "src/services/TabsetService2";
import {useUiService} from "src/services/useUiService";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {useSearchStore} from "src/stores/searchStore";
import {MoveToTabsetCommand} from "src/domain/tabs/MoveToTabset";
import {useUtils} from "src/services/Utils";
import TabsetListContextMenu from "components/widgets/helper/TabsetListContextMenu.vue";
import {Tab} from "src/models/Tab";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";

const {handleError, handleSuccess} = useNotificationHandler()
const {inBexMode} = useUtils()

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useSearchStore()
const spacesStore = useSpacesStore()

const $q = useQuasar();
const localStorage = $q.localStorage
const newTabsetName = ref('')
const activeTabset = ref<string | undefined>(tabsStore.currentTabsetId)
const merge = ref(false)
const expanded = ref<boolean[]>([])
const hoveredTab = ref<string | undefined>(undefined)

const {selectTabset} = useTabsetService()

const props = defineProps({
  tabsets: {type: Array as PropType<Array<Tabset>>, required: true},
  spaceId: {type: String, required: false},
  fromPanel: {type: Boolean, default: false}
})

onMounted(() => {
  expanded.value = new Array(props.tabsets?.length).fill(false);
})

watchEffect(() => {
  activeTabset.value = tabsStore.currentTabsetId
})

const selectTS = (tabset: Tabset) => {
  console.log("selecting", tabset.id, props.spaceId)
  useCommandExecutor()
    .execute(new SelectTabsetCommand(tabset.id, props.spaceId))
    .then(() => {
      activeTabset.value = tabset.id
      if (!props.fromPanel) {
        tabset.type === TabsetType.DYNAMIC ?
          router.push("/dynamicTs/" + tabset.id) :
          router.push("/tabsets/" + tabset.id)
      } else {
        tabset.type === TabsetType.DYNAMIC ?
          router.push("/sidepanel/dynamicTs/" + tabset.id) :
          router.push("/sidepanel")
      }
    })
}

const onDrop = (evt: DragEvent, tabsetId: string) => {
  const tabId = useUiService().droppingTab()
  if (evt.dataTransfer && tabId) {
    useCommandExecutor().executeFromUi(new MoveToTabsetCommand(tabId, tabsetId, tabsStore.currentTabsetId, evt.shiftKey))
  }
}

const deleteDialog = (tabset: Tabset) =>
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name
    }
  })


const open = (tab: Tab) => {
  console.log("clicked", process.env.MODE, tab.id)
  if ("electron" === process.env.MODE) {
    router.push("/browser/" + tab.id)
  } else if (tab.chromeTab.url) {
    openURL(tab.chromeTab.url)
    //router.push("/iframe/" + tabId)
  }
}

const toggleExpand = (index: number): void => {
  expanded.value[index] = !expanded.value[index]
}

const hoveredOver = (tabsetId: string) => hoveredTab.value === tabsetId

const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))

</script>

<style>
.q-expansion-item__content {
  border: 1px solid #f5f5f5
}

.darken-on-hover:hover {
  background-color: #efefef !important;
}

</style>
