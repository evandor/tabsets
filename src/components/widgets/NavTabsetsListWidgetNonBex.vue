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
                          @mouseover="showButtons(tabset.id, true)"
                          @mouseleave="showButtons(tabset.id, false)"
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
                    <q-icon name="build_circle" color="blue-10" class="q-ml-none q-mr-sm"
                            style="position:relative;top:-5px;left:-2px;"
                            v-if="tabset.type === TabsetType.DYNAMIC">
                      <q-tooltip class="tooltip">The tabs of this tabset have been generated automatically</q-tooltip>
                    </q-icon>
                    <q-icon name="local_library" color="blue-10" class="q-ml-none q-mr-sm"
                            style="position:relative;top:-5px;left:-2px;"
                            v-if="tabset.type === TabsetType.DYNAMIC">
                      <q-tooltip class="tooltip">This tabset is readonly</q-tooltip>
                    </q-icon>
                    {{ tabset.name }}
                  </div>
                  <!--                  <div class="col text-right">-->
                  <!--                    <q-icon v-if="showDeleteButton.get(tabset.id)"-->
                  <!--                            name="delete_outline" color="negative" size="1.1rem" @click.stop="deleteDialog(tabset)">-->
                  <!--                      <q-tooltip>Delete this tabset...</q-tooltip>-->
                  <!--                    </q-icon>-->
                  <!--                    <q-icon v-else name="shim" color="negative" size="1.1rem"></q-icon>-->
                  <!--                  </div>-->
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
            <span v-else>
                {{ tabset.tabs.length }}
            </span>
            <q-menu :offset="[0, 0]">
              <q-list dense style="min-width: 200px">
                <q-item v-if="tabset.tabs.length > 0"
                        clickable v-close-popup @click="toggleExpand(index)">
                  {{ expanded[index] ? 'Collapse' : 'Expand' }}
                </q-item>
                <q-item v-if="tabset.status === TabsetStatus.DEFAULT"
                        clickable v-close-popup @click="markAsFavorite(tabset.id)">
                  Make favorite
                </q-item>
                <q-item v-if="tabset.status === TabsetStatus.FAVORITE"
                        clickable v-close-popup @click="markAsDefault(tabset.id)">
                  Remove as favorite
                </q-item>

                <q-item v-if="tabset.type === TabsetType.DEFAULT && tabset.status !== TabsetStatus.DELETED"
                        clickable v-close-popup @click="archiveTabset(tabset.id)">
                  Archive Tabset
                </q-item>
                <q-separator v-if="tabset.tabs.length > 0 && inBexMode()"/>
                <q-item v-if="tabset.tabs.length > 0 && inBexMode()"
                        clickable v-close-popup @click="restoreDialog(tabset.id)">
                  Open all the tabs in a new window...
                </q-item>
                <q-separator/>
                <q-item clickable v-close-popup @click.stop="deleteDialog(tabset)">
                  Delete Tabset...
                </q-item>
              </q-list>
            </q-menu>
          </q-item-section>
        </template>

        <div v-for="tab in tabset.tabs">
          <q-card flat class="q-mt-none q-ml-lg q-mb-sm q-pa-none" style="max-width:260px">
            <q-card-section class="q-ma-none q-pa-none">
              <div class="row items-baseline cursor-pointer" @click.stop="open(tab.id)">
                <div class="col-1">
                  <TabFaviconWidget height="12px" width="12px" :tab="tab"/>
                </div>
                <div class="col-11 ellipsis">
                  {{ tab.chromeTab.title }}
                  <q-tooltip class="tooltip">{{ tab.chromeTab.url }}</q-tooltip>
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

import {onMounted, PropType, ref} from "vue";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useSpacesStore} from "src/stores/spacesStore";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useTabsetService} from "src/services/TabsetService2";
import {useUiService} from "src/services/useUiService";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {useSearchStore} from "src/stores/searchStore";
import {MoveToTabsetCommand} from "src/domain/tabs/MoveToTabset";
import {DrawerTabs} from "stores/uiStore";
import {MarkTabsetAsFavoriteCommand} from "src/domain/tabsets/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import {MarkTabsetAsArchivedCommand} from "src/domain/tabsets/MarkTabsetAsArchived";
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import {useUtils} from "src/services/Utils";

const {handleError, handleSuccess} = useNotificationHandler()
const {inBexMode} = useUtils()

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useSearchStore()
const spacesStore = useSpacesStore()

const showDeleteButton = ref<Map<string, boolean>>(new Map())
const showEditButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();
const localStorage = $q.localStorage
const newTabsetName = ref('')
const activeTabset = ref<string | undefined>(undefined)
const merge = ref(false)
const showExpandIcon = ref<string | undefined>(undefined)
const expanded = ref<boolean[]>([])
const hoveredTab = ref<string | undefined>(undefined)

const {selectTabset} = useTabsetService()

const props = defineProps({
  tabsets: {
    type: Array as PropType<Array<Tabset>>,
    required: true
  }
})

onMounted(() => {
  expanded.value = new Array(props.tabsets?.length).fill(false);
})

const selectTS = (tabset: Tabset) => {
  console.log("selecting", tabset.id)
  useCommandExecutor()
    .execute(new SelectTabsetCommand(tabset.id))
    .then(() => {
      activeTabset.value = tabset.id
      tabset.type === TabsetType.DYNAMIC ? router.push("/dynamicTs/" + tabset.id) : router.push("/tabsets/" + tabset.id)
    })
}

const showButtons = (tabsetId: string, show: boolean) => {
  if (show) {
    if (tabsetId === tabsStore.currentTabsetId) {
      showDeleteButton.value.set(tabsetId, true)
    }
  } else {
    showDeleteButton.value.set(tabsetId, show)
  }
  showEditButton.value.set(tabsetId, show)
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


const open = (tabId: string) => {
  console.log("clicked", process.env.MODE, tabId)
  if ("electron" === process.env.MODE) {
    router.push("/browser/" + tabId)
  } else {
    router.push("/iframe/" + tabId)
  }
}

const toggleExpand = (index: number): void => {
  expanded.value[index] = !expanded.value[index]
}

const hoveredOver = (tabsetId: string) => hoveredTab.value === tabsetId

const markAsFavorite = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(tabsetId))
const markAsDefault = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabsetId))
const archiveTabset = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabsetId))

const restoreDialog = (tabsetId: string) => $q.dialog({
  component: RestoreTabsetDialog,
  componentProps: {tabsetId: tabsetId}
})


</script>

<style>
.q-expansion-item__content {
  border: 1px solid #f5f5f5
}

.darken-on-hover:hover {
  background-color: #efefef !important;
}

</style>
