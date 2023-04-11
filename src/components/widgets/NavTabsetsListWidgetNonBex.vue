<template>
  <div class="q-ma-none q-pa-none" style="max-width:300px">
    <q-list>
      <q-expansion-item v-for="(tabset,index) in tabsets" group="thegroup"
                        dense-toggle dense hide-expand-icon
                        v-model="expanded[index]"
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
            <div class="row">
              <div class="col-10 ellipsis">
                {{ tabset.name }}
              </div>
              <div class="col text-right">
                <q-icon v-if="showDeleteButton.get(tabset.id)"
                        name="delete_outline" color="negative" size="1.1rem" @click.stop="deleteDialog(tabset)">
                  <q-tooltip>Delete this tabset...</q-tooltip>
                </q-icon>
                <q-icon v-else name="shim" color="negative" size="1.1rem"></q-icon>
              </div>
            </div>
          </q-item-section>
          <q-item-section class="text-right q-mx-sm cursor-pointer"
                          @click="toggleExpand(index)"
                          style="max-width:25px;font-size: 12px;color:#bfbfbf">
            {{ tabset.tabs.length }}&nbsp;
          </q-item-section>
        </template>

        <div v-for="tab in tabset.tabs">
          <q-card flat class="q-mt-none q-ml-lg q-mb-lg q-pa-none" style="max-width:260px;border:1px solid green">
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
import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "stores/tabsStore";
import {useSpacesStore} from "stores/spacesStore";
import EditTabset from "components/dialogues/EditTabsetDialog.vue";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {MarkTabsetAsFavoriteCommand} from "src/domain/tabsets/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useTabsetService} from "src/services/TabsetService2";
import {useUiService} from "src/services/useUiService";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import {SelectTabsetCommand} from "src/domain/tabsets/SelectTabset";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {useSearchStore} from "stores/searchStore";
import {MoveToTabsetCommand} from "src/domain/tabs/MoveToTabset";

const {handleError, handleSuccess} = useNotificationHandler()

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

const editDialog = (tabset: Tabset) =>
  $q.dialog({
    component: EditTabset,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name
    }
  })

const markAsFavorite = (ts: Tabset) => useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(ts.id))
const markAsDefault = (ts: Tabset) => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(ts.id))
//const archiveTabset = (ts: Tabset) => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(ts.id))
const stopSession = (ts: Tabset) => useCommandExecutor().executeFromUi(new StopSessionCommand(ts))

const open = (tabId: string) => {
  console.log("clicked", process.env.MODE, tabId)
  if ("electron" === process.env.MODE) {
    router.push("/browser/" + tabId)
  } else {
    router.push("/iframe/" + tabId)
  }
}

const toggleExpand = (index: number):void => {
  expanded.value[index] = !expanded.value[index]
  console.log("expanded", expanded.value)
}

</script>

<style>
.q-expansion-item__content {
  border:1px solid blue
}
</style>
