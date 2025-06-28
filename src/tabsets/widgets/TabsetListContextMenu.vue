<template>
  <q-menu :offset="[40, 0]">
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

      <!--      <q-item v-if="!props.inSidePanel" clickable v-close-popup @click="showDetails(props.tabset.id)">-->
      <!--        <q-icon name="o_info" class="q-my-xs q-mr-xs" color="grey-5" style="position: relative; top: -1px" />-->
      <!--        Tabset Details...-->
      <!--      </q-item>-->
      <!--      <q-item v-if="props.tabset?.status === TabsetStatus.DEFAULT && props.tabset?.type !== TabsetType.SPECIAL"-->
      <!--              clickable v-close-popup @click="markAsFavorite(props.tabset.id)">-->
      <!--        <q-icon name="stars" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>-->
      <!--        Make favorite-->
      <!--      </q-item>-->
      <!--      <q-item v-if="props.tabset.status === TabsetStatus.FAVORITE"-->
      <!--              clickable v-close-popup @click="markAsDefault(props.tabset.id)">-->
      <!--        <q-icon name="o_stars" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>-->
      <!--        Remove as favorite-->
      <!--      </q-item>-->

      <q-item
        v-if="tabset.type === TabsetType.SESSION && tabset.status !== TabsetStatus.DELETED"
        clickable
        v-close-popup
        @click="stopSession(props.tabset.id)">
        Stop active Session
      </q-item>

      <q-item
        v-if="
          useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET) &&
          props.tabset.type === TabsetType.DEFAULT &&
          props.tabset.status !== TabsetStatus.DELETED
        "
        clickable
        v-close-popup
        @click="archiveTabset(props.tabset.id)">
        Archive Tabset
      </q-item>

      <!--      <q-separator v-if="props.tabset.type !== TabsetType.DYNAMIC" />-->
      <!--      <q-item v-if="props.tabset.type !== TabsetType.DYNAMIC && props.tabset.sharing.sharing" clickable>-->
      <!--        <q-item-section>Sharing</q-item-section>-->
      <!--        <q-item-section side>-->
      <!--          <q-icon name="keyboard_arrow_right" />-->
      <!--        </q-item-section>-->

      <!--        <q-menu anchor="top end" self="top start">-->
      <!--          <q-list dense>-->
      <!--            <q-item-->
      <!--              v-if="props.tabset.sharing.sharing === TabsetSharing.UNSHARED || !props.tabset.sharing"-->
      <!--              clickable-->
      <!--              v-close-popup-->
      <!--              @click="sharePublicly(props.tabset.id)">-->
      <!--              <q-item-section>Share publicly</q-item-section>-->
      <!--            </q-item>-->
      <!--            <q-item-->
      <!--              v-if="props.tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK"-->
      <!--              @click="openPublicShare(props.tabset.id)"-->
      <!--              clickable-->
      <!--              v-close-popup>-->
      <!--              <q-item-section>Open public page</q-item-section>-->
      <!--            </q-item>-->
      <!--            <q-item-->
      <!--              v-if="props.tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK"-->
      <!--              @click="copyPublicShareToClipboard(props.tabset.id)"-->
      <!--              clickable-->
      <!--              v-close-popup>-->
      <!--              <q-item-section>Copy public page link</q-item-section>-->
      <!--            </q-item>-->
      <!--            <q-item-->
      <!--              v-if="props.tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK"-->
      <!--              clickable-->
      <!--              v-close-popup-->
      <!--              @click="removePublicShare(props.tabset.id)">-->
      <!--              <q-item-section>Remove public share</q-item-section>-->
      <!--            </q-item>-->
      <!--          </q-list>-->
      <!--        </q-menu>-->
      <!--      </q-item>-->

      <q-separator v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)" />
      <q-item v-if="useFeaturesStore().hasFeature(FeatureIdent.SPACES)" clickable>
        <q-item-section>Spaces</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right" />
        </q-item-section>

        <q-menu :offset="[10, 10]">
          <q-list>
            <q-item>Add to Space...</q-item>
            <q-separator />
            <q-item
              v-for="space in addToSpaces(tabset)"
              :key="space['spaceId' as keyof object]"
              dense
              @click="addToSpace(tabset, space['spaceId' as keyof object])"
              clickable>
              <q-item-section
                ><i>{{ space['spaceName' as keyof object] }}</i></q-item-section
              >
            </q-item>
          </q-list>
          <q-separator />
          <q-item>Remove from Space...</q-item>
          <q-separator />
          <q-list>
            <q-item
              v-for="space in removeFromSpaces(tabset)"
              :key="space['spaceId' as keyof object]"
              dense
              @click="removeFromSpace(tabset, space['spaceId' as keyof object])"
              clickable>
              <q-item-section
                ><i>{{ space['spaceName' as keyof object] }}</i></q-item-section
              >
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-separator v-if="props.tabset.tabs.length > 0 && inBexMode()" />
      <q-item v-if="props.tabset.tabs.length > 0 && inBexMode()" clickable>
        <q-item-section>Open all tabs...</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right" />
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

      <q-separator />
      <q-item clickable v-close-popup @click.stop="exportTabset(tabset)">
        <q-icon name="o_folder_copy" class="q-my-xs q-mr-xs" color="grey-5" style="position: relative; top: -1px" />
        Export Tabset...
      </q-item>
      <q-item clickable v-close-popup @click.stop="copyTabset(tabset)">
        <q-icon name="o_folder_copy" class="q-my-xs q-mr-xs" color="grey-5" style="position: relative; top: -1px" />
        Copy tabset...
      </q-item>
      <q-separator />
      <q-item clickable v-close-popup @click.stop="deleteDialog(tabset)">
        <q-icon name="o_delete" class="q-my-xs q-mr-xs" color="red" style="position: relative; top: -1px" />
        Delete tabset...
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { openURL, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { CopyToClipboardCommand } from 'src/core/domain/commands/CopyToClipboard'
import { SpaceInfo } from 'src/core/models/SpaceInfo'
import { ViewPort } from 'src/core/models/ViewPort'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useEntityRegistryStore } from 'src/core/stores/entityRegistryStore'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { CopyTabsetCommand } from 'src/tabsets/commands/CopyTabsetCommand'
import { DeleteTabsetCommand } from 'src/tabsets/commands/DeleteTabsetCommand'
import { MarkTabsetAsArchivedCommand } from 'src/tabsets/commands/MarkTabsetAsArchived'
import { RestoreTabsetCommand } from 'src/tabsets/commands/RestoreTabset'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import ExportDialog from 'src/tabsets/dialogues/ExportDialog.vue'
import RestoreTabsetDialog from 'src/tabsets/dialogues/RestoreTabsetDialog.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { DrawerTabs, useUiStore } from 'src/ui/stores/uiStore'

const { inBexMode } = useUtils()

type Props = {
  tabset: Tabset
  index: number
  hoveredTab?: string
  viewPort: ViewPort
}

const props = withDefaults(defineProps<Props>(), {
  // viewPort: 'sidepanel',
})

// const props = defineProps({
//   tabset: { type: Object as PropType<Tabset>, required: true },
//   index: { type: Number, required: true },
//   hoveredTab: { type: String, required: false },
//   viewPort: { type: Object as PropType<ViewPort>, required: true },
// })

// const emit = defineEmits(['toggleExpand']);

const $q = useQuasar()

const archiveTabset = (tabsetId: string) =>
  useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabsetId))

const showDetails = (tabsetId: string) => useUiStore().rightDrawerSetActiveTab(DrawerTabs.TABSET_DETAILS)

const stopSession = (tabsetId: string) => {
  const tabset = useTabsetsStore().getTabset(tabsetId)
  if (tabset) {
    //useCommandExecutor().executeFromUi(new StopSessionCommand(tabset))
  }
}

const sharePublicly = (tabsetId: string) => {
  //useCommandExecutor().executeFromUi(new ShareTabsetCommand(tabsetId, TabsetSharing.PUBLIC))
}
const removePublicShare = (tabsetId: string) => {
  //useCommandExecutor().executeFromUi(new UnShareTabsetCommand(tabsetId))
}

const publictabsetsPath = 'https://tabsets.web.app/#/tabsets/'

const openPublicShare = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharing?.sharedId) {
    openURL(getPublicTabsetLink(ts))
  }
}

const copyPublicShareToClipboard = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharing?.sharedId) {
    useCommandExecutor().executeFromUi(new CopyToClipboardCommand(getPublicTabsetLink(ts)))
  }
}

const restoreInGroup = (tabsetId: string) =>
  useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, undefined, false))

const restoreDialog = (tabsetId: string) =>
  $q.dialog({
    component: RestoreTabsetDialog,
    componentProps: { tabsetId: tabsetId },
  })

const addToSpaces = (tabset: Tabset) => {
  const hasSpaces: string[] = tabset.spaces
  // const allSpaces: Map<string, Space> = useSpacesStore().spaces
  const allSpaces: SpaceInfo[] = useEntityRegistryStore().spacesRegistry
  let addList: object[] = []
  _.forEach(allSpaces, (availableSpace: SpaceInfo) => {
    if (hasSpaces.indexOf(availableSpace.id) < 0) {
      addList.push({
        spaceId: availableSpace.id,
        spaceName: availableSpace.name, //allSpaces.get(availableSpace)?.label || "---"
      })
    }
  })
  return addList
}

const removeFromSpaces = (tabset: Tabset) => {
  const hasSpaces: string[] = tabset.spaces
  // const allSpaces: Map<string, Space> = useSpacesStore().spaces
  const allSpaces: SpaceInfo[] = useEntityRegistryStore().spacesRegistry
  let removeList: object[] = []
  _.forEach(hasSpaces, (availableSpace: string) => {
    removeList.push({
      spaceId: availableSpace,
      spaceName: _.filter(allSpaces, (s: SpaceInfo) => s.id === availableSpace)[0]?.name || '---',
    })
  })
  return removeList
}

const addToSpace = (tabset: Tabset, spaceId: string) => {
  tabset.spaces.push(spaceId)
  console.log('spaces set to', tabset.spaces)
  useTabsetService().saveTabset(tabset)
}

const removeFromSpace = (tabset: Tabset, spaceId: string) => {
  console.log('removing space', tabset.id, spaceId)
  tabset.spaces = _.filter(tabset.spaces, (s: string) => s !== spaceId)
  console.log('spaces set to', tabset.spaces)
  useTabsetService().saveTabset(tabset)
}

const copyTabset = (tabset: Tabset) => {
  useCommandExecutor().executeFromUi(new CopyTabsetCommand(tabset))
}

const exportTabset = (tabset: Tabset) => {
  const filename = `tabset-${props.tabset.name}-${import.meta.env.PACKAGE_VERSION}.json`
  $q.dialog({ component: ExportDialog, componentProps: { filename: filename, tabset: props.tabset } }).onOk(
    (tabsetId: any) => {
      //useTabsetService().selectTabset(tabsetId)
    },
  )
}

const deleteDialog = (tabset: Tabset) => {
  if (tabset.tabs.length === 0) {
    useCommandExecutor().executeFromUi(new DeleteTabsetCommand(tabset.id))
    return
  }
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name,
      sidePanelMode: false,
      tabsCount: tabset.tabs.length,
      redirectTo: '/sidepanel/tabsets',
    },
  })
}

const getPublicTabsetLink = (ts: Tabset) => {
  let image = 'https://tabsets.web.app/favicon.ico'
  if (ts && ts.sharing?.sharedId) {
    ts.tabs.reverse().forEach((t: Tab) => {
      if (t.image) {
        image = t.image
      }
    })
    return publictabsetsPath + ts.sharing?.sharedId + '?n=' + btoa(ts.name) + '&i=' + btoa(image)
  }
  return image
}
</script>
