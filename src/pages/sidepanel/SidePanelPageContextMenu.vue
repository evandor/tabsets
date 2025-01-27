<template>
  <q-menu :offset="[22, 6]">
    <q-list dense style="min-width: 200px">
      <ContextMenuItem
        v-close-popup
        @was-clicked="openEditTabsetDialog(tabset)"
        icon="o_note"
        :label="tabset.type === TabsetType.SESSION ? 'Edit Session' : 'Edit Tabset'" />

      <template v-if="tabset.type === TabsetType.SESSION">
        <q-separator inset />

        <ContextMenuItem
          v-close-popup
          @was-clicked="convertToCollection(tabset)"
          color="warning"
          icon="o_folder"
          label="Convert to Collection" />
      </template>

      <template v-if="tabset.type === TabsetType.DEFAULT">
        <q-separator inset />

        <ContextMenuItem
          v-close-popup
          @was-clicked="createSubfolder(tabset)"
          color="warning"
          icon="o_folder"
          label="Create Subfolder" />
      </template>

      <q-separator inset v-if="useTabsetsStore().tabsets.size > 1" />

      <ContextMenuItem
        v-close-popup
        v-if="showCreateNoteItem()"
        @was-clicked="startTabsetNote(tabset)"
        icon="o_description"
        label="Create Note" />

      <template v-if="tabset.tabs.length > 0 && inBexMode() && (!tabset.window || tabset.window === 'current')">
        <ContextMenuItem icon="open_in_new" label="Open all in...">
          <q-item-section side>
            <q-icon name="keyboard_arrow_right" />
          </q-item-section>
          <q-menu anchor="top end" self="top start">
            <q-list>
              <q-item
                v-if="useFeaturesStore().hasFeature(FeatureIdent.AUTO_TAB_SWITCHER)"
                dense
                clickable
                v-close-popup
                @click="startAutoSwitchingTab(tabset.id)">
                <q-item-section>switching tab</q-item-section>
              </q-item>
              <q-item dense clickable v-close-popup @click="restoreInNewWindow(tabset.id)">
                <q-item-section>new window</q-item-section>
              </q-item>
              <q-item dense clickable v-close-popup @click="restoreInGroup(tabset.id)">
                <q-item-section>this window</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </ContextMenuItem>
      </template>

      <template v-if="tabset.tabs.length > 0 && inBexMode() && tabset.window && tabset.window !== 'current'">
        <ContextMenuItem
          v-close-popup
          @was-clicked="restoreInGroup(tabset.id, tabset.window)"
          icon="open_in_new"
          label="Open in window..." />
      </template>

      <template v-if="tabset.tabs.length > 0 && inBexMode() && useFeaturesStore().hasFeature(FeatureIdent.GALLERY)">
        <ContextMenuItem
          v-close-popup
          @was-clicked="openOverviewPage(tabset.id)"
          icon="calendar_view_month"
          label="Show Gallery" />
      </template>

      <template
        v-if="useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET) && tabset.status === TabsetStatus.DEFAULT">
        <ContextMenuItem
          v-close-popup
          @was-clicked="archiveTabset(tabset)"
          icon="o_inventory_2"
          color="warning"
          label="Archive" />
      </template>

      <q-separator inset />

      <template v-if="useFeaturesStore().hasFeature(FeatureIdent.TABSETS_SHARING)">
        <ContextMenuItem label="Sharing..." icon="ios_share">
          <q-item-section side>
            <q-icon name="keyboard_arrow_right" />
          </q-item-section>
          <q-menu anchor="top end" self="top start">
            <q-list>
              <q-item
                v-if="tabset.sharing.sharing === TabsetSharing.UNSHARED || !tabset.sharing"
                color="warning"
                dense
                clickable
                v-close-popup
                @click="shareTabsetPubliclyDialog(tabset)">
                <q-item-section>Publish publicly...</q-item-section>
                <q-tooltip class="tooltip-small">Publish this tabset</q-tooltip>
              </q-item>
              <q-item
                v-if="tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED"
                color="warning"
                dense
                clickable
                v-close-popup
                @click="shareTabsetPubliclyDialog(tabset, true)">
                <q-item-section>Republish</q-item-section>
                <q-tooltip class="tooltip-small">Tabset has changed, republish</q-tooltip>
              </q-item>
              <q-item
                v-if="
                  tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK ||
                  tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED
                "
                color="warning"
                dense
                clickable
                v-close-popup
                @click="copyPublicShareToClipboard(tabset.id)">
                <q-item-section>Copy Share URL</q-item-section>
                <q-tooltip class="tooltip-small">Copy the link to the shared tabset</q-tooltip>
              </q-item>
              <q-item
                v-if="
                  tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK ||
                  tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED
                "
                color="warning"
                dense
                clickable
                v-close-popup
                @click="openPublicShare(tabset.id)">
                <q-item-section>Open Shared Page</q-item-section>
                <q-tooltip class="tooltip-small">Open the shared location</q-tooltip>
              </q-item>
              <q-item color="warning" dense clickable v-close-popup @click="openShareWithDialog(tabset)">
                <q-item-section>Share with...</q-item-section>
                <q-tooltip class="tooltip-small">Share with User or Team</q-tooltip>
              </q-item>
              <q-item
                v-if="
                  tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK ||
                  tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED
                "
                color="warning"
                dense
                clickable
                v-close-popup
                @click="removePublicShare(tabset.id, tabset.sharing?.sharedId || '')">
                <q-item-section>Stop Sharing</q-item-section>
                <q-tooltip class="tooltip-small">Delete Shared Link</q-tooltip>
              </q-item>
            </q-list>
          </q-menu>
        </ContextMenuItem>

        <q-separator inset />
      </template>

      <!--      <template v-if="useFeaturesStore().hasFeature(FeatureIdent.DEV_MODE)">-->
      <!--        <ContextMenuItem v-close-popup-->
      <!--                         @was-clicked="useSearchStore().reindexTabset(tabset.id)"-->
      <!--                         icon="o_note"-->
      <!--                         label="Re-Index Search (dev)"/>-->

      <!--        <q-separator inset/>-->
      <!--      </template>-->

      <ContextMenuItem
        v-close-popup
        @was-clicked="deleteTabsetDialog(tabset as Tabset)"
        icon="o_delete"
        color="negative"
        :disable="tabset.sharing?.sharedId !== undefined"
        :label="tabset.type === TabsetType.SESSION ? 'Delete Session' : 'Delete Tabset'">
        <q-tooltip class="tooltip-small" v-if="tabset.sharing?.sharedId !== undefined">
          Stop sharing first if you want to delete this tabset
        </q-tooltip>
      </ContextMenuItem>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>
import { LocalStorage, openURL, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { CopyToClipboardCommand } from 'src/core/domain/commands/CopyToClipboard'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { NotificationType } from 'src/core/services/ErrorHandler'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import NavigationService from 'src/services/NavigationService'
import { DeleteTabsetCommand } from 'src/tabsets/commands/DeleteTabsetCommand'
import { MarkTabsetAsArchivedCommand } from 'src/tabsets/commands/MarkTabsetAsArchived'
import { RestoreTabsetCommand } from 'src/tabsets/commands/RestoreTabset'
import { UnShareTabsetCommand } from 'src/tabsets/commands/UnShareTabsetCommand'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import NewSubfolderDialog from 'src/tabsets/dialogues/NewSubfolderDialog.vue'
import ShareTabsetDialog from 'src/tabsets/dialogues/ShareTabsetDialog.vue'
import ShareTabsetPubliclyDialog from 'src/tabsets/dialogues/ShareTabsetPubliclyDialog.vue'
import { Tabset, TabsetSharing, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { PropType } from 'vue'
import { useRouter } from 'vue-router'

const { inBexMode } = useUtils()

const $q = useQuasar()
const router = useRouter()

const props = defineProps({
  tabset: { type: Object as PropType<Tabset>, required: true },
})

const emits = defineEmits(['editHeaderDescription'])

const startTabsetNote = (tabset: Tabset) => {
  const url =
    chrome && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('www/index.html') + '#/mainpanel/notes/?tsId=' + tabset.id + '&edit=true'
      : '#/mainpanel/notes/?tsId=' + tabset.id + '&edit=true'
  NavigationService.openOrCreateTab([url])
}

const createSubfolder = (tabset: Tabset) => {
  $q.dialog({
    component: NewSubfolderDialog,
    componentProps: {
      tabsetId: tabset.id,
      parentFolder: undefined,
    },
  })
}

const openEditTabsetDialog = (tabset: Tabset) => {
  $q.dialog({
    component: EditTabsetDialog,
    //TODO switch to tabset: tabset?
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name,
      tabsetColor: tabset.color,
      window: tabset.window,
      details: tabset.details || useUiStore().listDetailLevel,
      fromPanel: true,
    },
  })
}

const restoreInNewWindow = (tabsetId: string, windowName: string | undefined = undefined) =>
  useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, windowName))

const startAutoSwitchingTab = (tabsetId: string) => {
  const tabset = useTabsetsStore().getTabset(tabsetId)
  if (tabset && tabset.tabs?.length > 1 && tabset.tabs[0]!.url) {
    const tabs = tabset.tabs
    let tabIndex = 0
    NavigationService.openSingleTab(tabset.tabs[tabIndex]!.url || '').then((tab) => {
      console.log('tabId', tab)
      let interval = setInterval(
        () => {
          try {
            const nextTab = tabs[++tabIndex % tabs.length]
            console.log('updating ', nextTab!.url)
            chrome.tabs.update(tab.id || 0, { url: nextTab!.url }, (cb) => {
              if (chrome.runtime.lastError) {
                console.warn('got runtime error', chrome.runtime.lastError)
                clearInterval(interval)
              }
            })
          } catch (err) {
            console.log('got error', err, interval)
            clearInterval(interval)
          }
        },
        (LocalStorage.getItem('ui.tabSwitcher') as number) || 5000,
      )
    })
  }
}

const restoreInGroup = (tabsetId: string, windowName: string | undefined = undefined) =>
  useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, windowName, false))

const openOverviewPage = (tabsetId: string) =>
  NavigationService.openOrCreateTab([chrome.runtime.getURL(`www/index.html#/mainpanel/tabsets/overview/${tabsetId}`)])

const focus = (tabset: Tabset) => router.push('/sidepanel/tabsets/' + tabset.id)

const showCreateNoteItem = () => useFeaturesStore().hasFeature(FeatureIdent.NOTES)

const removePublicShare = (tabsetId: string, sharedId: string) =>
  useCommandExecutor().executeFromUi(new UnShareTabsetCommand(tabsetId, sharedId))

const archiveTabset = (tabset: Tabset) =>
  useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabset.id), NotificationType.NOTIFY)

const deleteTabsetDialog = (tabset: Tabset): void => {
  if (tabset.tabs.length === 0) {
    useCommandExecutor().executeFromUi(new DeleteTabsetCommand(tabset.id))
    return
  }
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name,
      tabsCount: tabset.tabs.length,
    },
  })
}

const convertToCollection = (tabset: Tabset) => {
  tabset.type = TabsetType.DEFAULT
  useTabsetsStore().saveTabset(tabset)
}

const shareTabsetPubliclyDialog = (tabset: Tabset, republish: boolean = false) => {
  $q.dialog({
    component: ShareTabsetPubliclyDialog,
    componentProps: {
      tabsetId: tabset.id,
      sharedId: tabset.sharing?.sharedId,
      tabsetName: tabset.name,
      republish: republish,
    },
  })
}

const openShareWithDialog = (tabset: Tabset, republish: boolean = false) => {
  $q.dialog({
    component: ShareTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      sharedId: tabset.sharing?.sharedId,
      tabsetName: tabset.name,
      republish: republish,
    },
  })
}

const openPublicShare = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharing?.sharedId) {
    openURL(getPublicTabsetLink(ts))
  }
}

const getPublicTabsetLink = (ts: Tabset) => {
  // https://shared.tabsets.net/#/pwa/imp/2f0f2171-27a6-4d03-a2dd-157ab6ef42ae?n=TXVzaWM=&a=Q2Fyc3Rlbg==
  // http://localhost:9200/#/pwa/imp/2f0f2171-27a6-4d03-a2dd-157ab6ef42ae?n=TXVzaWM=&a=Q2Fyc3Rlbg==
  let image = 'https://tabsets.web.app/favicon.ico'
  if (ts && ts.sharing?.sharedId) {
    //return PUBLIC_SHARE_URL + "#/pwa/imp/" + ts.sharing?.sharedId + "?n=" + btoa(ts.name) + "&a=" + btoa(ts.sharing?.sharedBy || 'n/a') + "&d=" + ts.sharedAt
    return (
      // 'https://us-central1-tabsets-backend-prd.cloudfunctions.net/app/share/preview/' +
      process.env.PWA_BACKEND_URL +
      '/#/pwa/imp/' +
      ts.sharing?.sharedId +
      '?n=' +
      btoa(ts.name) +
      '&a=' +
      btoa(ts.sharing?.sharedBy || 'n/a')
    )
  }
  return image
}

const copyPublicShareToClipboard = (tabsetId: string) => {
  const ts = useTabsetsStore().getTabset(tabsetId)
  if (ts && ts.sharing?.sharedId) {
    useCommandExecutor().executeFromUi(new CopyToClipboardCommand(getPublicTabsetLink(ts)))
  }
}
</script>
