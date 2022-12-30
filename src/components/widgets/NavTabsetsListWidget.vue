<template>

  <q-item
    v-for="(tabset,index) in tabsets"
    :key="'local_' + tabset.id"
    :data-testid="'navigation_tabset_' +  index"
    clickable v-ripple
    @click="selectTS(tabset.id)"
    @mouseover="showButtons(tabset.id, true)"
    @mouseleave="showButtons(tabset.id, false)"
    :style="tabset.id === tabsStore.currentTabsetId ? 'background-color:#efefef' : 'border:0px solid #bfbfbf'">

    <q-item-section no-wrap
                    @drop="onDrop($event, tabset.id)"
                    @dragover.prevent
                    @dragenter.prevent>
      <q-item-label>
        <template v-slot>
          <q-icon name="stars" color="warning" class="q-ml-none q-mr-sm"
                  v-if="tabset.status === TabsetStatus.FAVORITE"/>
          <q-icon name="explore" color="primary" class="q-ml-none q-mr-sm"
                  v-if="tabset.type === TabsetType.SESSION">
            <q-tooltip>This is a 'session' tabset, keeping track of your tabs automatically</q-tooltip>
          </q-icon>
          {{ tabsetLabel(tabset) }}
        </template>
      </q-item-label>
    </q-item-section>

    <q-space/>

    <q-item-section side v-if="showEditButton.get(tabset.id)">
      <q-icon name="edit" color="primary" size="18px" @click="editDialog(tabset)">
        <q-tooltip>Edit the tabset's name...</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section side v-if="showEditButton.get(tabset.id) && tabset.status === TabsetStatus.DEFAULT">
      <q-icon name="star" color="warning" size="18px" @click="markAsFavorite(tabset)">
        <q-tooltip>Marking this tabset as favorite</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section side v-if="showEditButton.get(tabset.id) && tabset.status === TabsetStatus.FAVORITE">
      <q-icon name="star" color="warning" size="18px" @click="markAsDefault(tabset)">
        <q-tooltip>Undo marking this tabset as favorite</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section side v-if="tabset.type === TabsetType.DEFAULT && showEditButton.get(tabset.id) && tabset.status !== TabsetStatus.DELETED">
      <q-icon name="inventory_2" color="primary" size="18px" @click="archiveTabset(tabset)">
        <q-tooltip>Archive this tabset</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section side v-if="tabset.type === TabsetType.SESSION && showEditButton.get(tabset.id) && tabset.status !== TabsetStatus.DELETED">
      <q-icon name="o_stop_circle" color="primary" size="18px" @click="stopSession(tabset)">
        <q-tooltip>Stop this session</q-tooltip>
      </q-icon>
    </q-item-section>

    <q-item-section side v-if="showDeleteButton.get(tabset.id)"
                    :data-testid="'navigation_tabset_delete_' +  index">
      <q-icon name="delete_outline" color="negative" size="18px" @click="deleteDialog(tabset)">
        <q-tooltip>Delete this tabset...</q-tooltip>
      </q-icon>
    </q-item-section>
  </q-item>
</template>

<script lang="ts" setup>

import {PropType, ref} from "vue";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import TabsetService from "src/services/TabsetService";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "stores/tabsStore";
import {useFeatureTogglesStore} from "stores/featureTogglesStore";
import {useSpacesStore} from "stores/spacesStore";
import EditTabset from "components/dialogues/EditTabsetDialog.vue";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {MarkTabsetAsFavoriteCommand} from "src/domain/commands/MarkTabsetAsFavoriteCommand";
import {MarkTabsetAsDefaultCommand} from "src/domain/commands/MarkTabsetAsDefaultCommand";
import {MarkTabsetAsArchivedCommand} from "src/domain/commands/MarkTabsetAsArchivedCommand";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useTabsetService} from "src/services/TabsetService2";
import {useUiService} from "src/services/useUiService";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";

const {handleError, handleSuccess} = useNotificationHandler()

const router = useRouter()
const tabsStore = useTabsStore()
const featuresStore = useFeatureTogglesStore()
const spacesStore = useSpacesStore()

const showDeleteButton = ref<Map<string, boolean>>(new Map())
const showEditButton = ref<Map<string, boolean>>(new Map())
const $q = useQuasar();
const localStorage = $q.localStorage
const newTabsetName = ref('')
const merge = ref(false)

const {selectTabset} = useTabsetService()

const props = defineProps({
  tabsets: {
    type: Array as PropType<Array<Tabset>>,
    required: true
  }
})

const selectTS = (tabsetId: string) => {
  selectTabset(tabsetId)
  // router.push("/tabset")
  router.push("/tabsets/" + tabsetId)
}

const showButtons = (tabsetId: string, show: boolean) => {
  showDeleteButton.value.set(tabsetId, show)
  showEditButton.value.set(tabsetId, show)
}

const tabsetLabel = (tabset: Tabset) => {
  return tabset.name + ' (' + tabset.tabs?.length + ')'
}

const onDrop = (evt: DragEvent, tabsetId: string) => {
  const tabId2 = useUiService().droppingTab()
  if (evt.dataTransfer && tabsetId && tabId2) {
    TabsetService.moveToTabset(tabId2, tabsetId)
  } else {
    console.log("got error dropping tab", tabsetId)
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
const archiveTabset = (ts: Tabset) => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(ts.id))
const stopSession = (ts: Tabset) => useCommandExecutor().executeFromUi(new StopSessionCommand(ts))

</script>
