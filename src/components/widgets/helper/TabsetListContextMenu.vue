<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">

<!--      <q-item v-if="props.tabset?.tabs.length > 0 && expanded[index]"-->
<!--              clickable v-close-popup @click="toggleExpand(index)">-->
<!--        <q-icon name="o_expand_less" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>-->
<!--        Collapse-->
<!--      </q-item>-->
<!--      <q-item v-if="props.tabset?.tabs.length > 0 && !expanded[index]"-->
<!--              clickable v-close-popup @click="toggleExpand(index)">-->
<!--        <q-icon name="o_expand_more" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>-->
<!--        Expand-->
<!--      </q-item>-->

<!--      <q-item v-if="props.tabset?.tabs.length > 0 && !expanded[index]"-->
<!--              clickable v-close-popup @click="openInSidePanel(index)">-->
<!--        <q-icon name="left_panel_close" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>-->
<!--        Open in sidePanel-->
<!--      </q-item>-->

      <q-item v-if="!props.inSidePanel"
        clickable v-close-popup @click="showDetails(props.tabset.id)">
        <q-icon name="o_info" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>
        Tabset Details...
      </q-item>
      <q-item v-if="props.tabset?.status === TabsetStatus.DEFAULT && props.tabset?.type !== TabsetType.SPECIAL"
              clickable v-close-popup @click="markAsFavorite(props.tabset.id)">
        <q-icon name="stars" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>
        Make favorite
      </q-item>
      <q-item v-if="props.tabset.status === TabsetStatus.FAVORITE"
              clickable v-close-popup @click="markAsDefault(props.tabset.id)">
        <q-icon name="o_stars" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>
        Remove as favorite
      </q-item>

      <q-item v-if="tabset.type === TabsetType.SESSION && tabset.status !== TabsetStatus.DELETED"
              clickable v-close-popup @click="stopSession(props.tabset.id)">
        Stop active Session
      </q-item>

      <q-item v-if="props.tabset.type === TabsetType.DEFAULT && props.tabset.status !== TabsetStatus.DELETED"
              clickable v-close-popup @click="archiveTabset(props.tabset.id)">
        Archive Tabset
      </q-item>

      <q-separator v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)"/>
      <q-item v-if="usePermissionsStore().hasFeature(FeatureIdent.SPACES)"
              clickable>
        <q-item-section>Spaces</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right"/>
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list>
            <q-item
              v-for="space in addToSpaces(tabset)"
              :key="space['spaceId']"
              dense
              @click="addToSpace(tabset, space['spaceId'])"
              clickable>
              <q-item-section>Add to Space <i>{{ space['spaceName'] }}</i></q-item-section>
            </q-item>
          </q-list>
          <q-separator/>
          <q-list>
            <q-item
              v-for="space in removeFromSpaces(tabset)"
              :key="space['spaceId']"
              dense
              @click="removeFromSpace(tabset, space['spaceId'])"
              clickable>
              <q-item-section>Remove from Space <i>{{ space['spaceName'] }}</i></q-item-section>
            </q-item>
          </q-list>
        </q-menu>

      </q-item>

      <q-separator v-if="props.tabset.tabs.length > 0 && inBexMode()"/>
      <q-item v-if="props.tabset.tabs.length > 0 && inBexMode()"
              clickable>
        <q-item-section>Open all tabsets tabs...</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right"/>
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list>
            <q-item dense clickable v-close-popup @click="restoreDialog(props.tabset.id)">
              <q-item-section>in a new window</q-item-section>
            </q-item>
            <q-item dense clickable v-close-popup @click="restoreInGroup(props.tabset.id)">
              <q-item-section>in current window</q-item-section>
            </q-item>
          </q-list>
        </q-menu>

      </q-item>

      <q-separator/>
      <q-item clickable v-close-popup @click.stop="copyTabset(tabset)">
        <q-icon name="o_folder_copy" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>
        Copy tabset...
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click.stop="deleteDialog(tabset)">
        <q-icon name="o_delete" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>
        Delete tabset...
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>

import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {PropType, ref} from "vue";
import {useUtils} from "src/services/Utils";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {MarkTabsetAsFavoriteCommand} from "src/domain/tabsets/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import {MarkTabsetAsArchivedCommand} from "src/domain/tabsets/MarkTabsetAsArchived";
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import {Space} from "src/models/Space";
import {useSpacesStore} from "src/stores/spacesStore";
import _ from "lodash";
import {useTabsetService} from "src/services/TabsetService2";
import {useQuasar} from "quasar";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import {DrawerTabs, useUiStore} from "src/stores/uiStore";
import {CopyTabsetCommand} from "src/domain/tabsets/CopyTabset";
import {RestoreTabsetCommand} from "src/domain/tabsets/RestoreTabset";

const {inBexMode} = useUtils()

const props = defineProps({
  tabset: {type: Object as PropType<Tabset>, required: true},
  index: {type: Number, required: true},
  hoveredTab: {type: String, required: false},
  inSidePanel: {type: Boolean, default: false}
})

// const emit = defineEmits(['toggleExpand']);

const $q = useQuasar()

const expanded = ref<boolean[]>([])

// const toggleExpand = (index: number): void => {
//   expanded.value[index] = !expanded.value[index]
//   emit('toggleExpand', index)
// }

const markAsFavorite = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(tabsetId))
const markAsDefault = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabsetId))
const archiveTabset = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabsetId))

const showDetails = (tabsetId: string) => useUiStore().rightDrawerSetActiveTab(DrawerTabs.TABSET_DETAILS, {tabsetId})

const stopSession = (tabsetId: string) => {
  const tabset = useTabsetService().getTabset(tabsetId)
  if (tabset) {
    useCommandExecutor().executeFromUi(new StopSessionCommand(tabset))
  }
}

const restoreInGroup = (tabsetId: string) => useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, false))

const restoreDialog = (tabsetId: string) => $q.dialog({
  component: RestoreTabsetDialog,
  componentProps: {tabsetId: tabsetId}
})

const addToSpaces = (tabset: Tabset) => {
  const hasSpaces: string[] = tabset.spaces
  const allSpaces: Map<string, Space> = useSpacesStore().spaces
  let addList: object[] = []
  _.forEach([...allSpaces.keys()], (availableSpace: string) => {
    if (hasSpaces.indexOf(availableSpace) < 0) {
      addList.push({
        spaceId: availableSpace,
        spaceName: allSpaces.get(availableSpace)?.label || "---"
      })
    }
  })
  return addList
}

const removeFromSpaces = (tabset: Tabset) => {
  const hasSpaces: string[] = tabset.spaces
  const allSpaces: Map<string, Space> = useSpacesStore().spaces
  let removeList: object[] = []
  _.forEach(hasSpaces, (availableSpace: string) => {
    removeList.push({
      spaceId: availableSpace,
      spaceName: allSpaces.get(availableSpace)?.label || "---"
    })
  })
  return removeList
}

const addToSpace = (tabset: Tabset, spaceId: string) => {
  tabset.spaces.push(spaceId)
  console.log("spaces set to", tabset.spaces)
  useTabsetService().saveTabset(tabset)
}

const removeFromSpace = (tabset: Tabset, spaceId: string) => {
  console.log("removing space", tabset.id, spaceId)
  tabset.spaces = _.filter(tabset.spaces, (s: string) => s !== spaceId)
  console.log("spaces set to", tabset.spaces)
  useTabsetService().saveTabset(tabset)
}

const copyTabset = (tabset: Tabset) => {
  useCommandExecutor().executeFromUi(new CopyTabsetCommand(tabset))
}

const deleteDialog = (tabset: Tabset) =>
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name
    }
  })


</script>
