<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">
      <q-item v-if="props.tabset?.tabs.length > 0"
              clickable v-close-popup @click="toggleExpand(index)">
        {{ expanded[index] ? 'Collapse' : 'Expand' }}
      </q-item>
      <q-item v-if="props.tabset?.status === TabsetStatus.DEFAULT"
              clickable v-close-popup @click="markAsFavorite(props.tabset.id)">
        Make favorite
      </q-item>
      <q-item v-if="props.tabset.status === TabsetStatus.FAVORITE"
              clickable v-close-popup @click="markAsDefault(props.tabset.id)">
        Remove as favorite
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
              clickable v-close-popup @click="restoreDialog(props.tabset.id)">
        Open all tabs in a new window...
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click.stop="deleteDialog(tabset)">
        Delete tabset...
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>

import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {PropType, ref} from "vue";
import {useUtils} from "src/services/Utils";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {MarkTabsetAsFavoriteCommand} from "src/domain/tabsets/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import {MarkTabsetAsArchivedCommand} from "src/domain/tabsets/MarkTabsetAsArchived";
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import {Space} from "src/models/Space";
import {useSpacesStore} from "stores/spacesStore";
import _ from "lodash";
import {useTabsetService} from "src/services/TabsetService2";
import {useQuasar} from "quasar";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";

const {inBexMode} = useUtils()

const props = defineProps({
  tabset: {
    type: Object as PropType<Tabset>,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  hoveredTab: {
    type: String,
    required: false
  }
})

const $q = useQuasar()

const expanded = ref<boolean[]>([])

const toggleExpand = (index: number): void => {
  expanded.value[index] = !expanded.value[index]
}

const markAsFavorite = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(tabsetId))
const markAsDefault = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabsetId))
const archiveTabset = (tabsetId: string) => useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabsetId))

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
  tabset.spaces = _.filter(tabset.spaces, (s:string) => s !== spaceId)
  console.log("spaces set to", tabset.spaces)
  useTabsetService().saveTabset(tabset)
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
