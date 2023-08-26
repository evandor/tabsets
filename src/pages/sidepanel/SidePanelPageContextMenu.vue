<template>
  <q-menu :offset="[60, -5]">
    <q-list dense style="min-width: 180px">

      <ContextMenuItem v-close-popup
                       v-if="usePermissionsStore().hasFeature(FeatureIdent.NOTES)"
                       @was-clicked="startTabsetNote(tabset)"
                       icon="o_add_circle"
                       label="Create Note"/>

      <q-separator/>

      <ContextMenuItem v-close-popup
                       @was-clicked="openEditTabsetDialog(tabset)"
                       icon="o_note"
                       label="Edit Tabset Name"/>

      <template v-if="tabset.tabs.length > 0 && inBexMode()">
        <q-separator/>
        <ContextMenuItem
            icon="open_in_new"
            label="Open all in...">

          <q-item-section side>
            <q-icon name="keyboard_arrow_right"/>
          </q-item-section>
          <q-menu anchor="top end" self="top start">
            <q-list>
              <q-item dense clickable v-close-popup @click="restoreInNewWindow(tabset.id)">
                <q-item-section>new window</q-item-section>
              </q-item>
              <q-item dense clickable v-close-popup @click="restoreInGroup(tabset.id)">
                <q-item-section>current window</q-item-section>
              </q-item>
            </q-list>
          </q-menu>

        </ContextMenuItem>

      </template>

      <template v-if="useSettingsStore().isEnabled('dev')">
        <q-separator/>
        <ContextMenuItem
            icon="keyboard_arrow_right"
            label="Sharing...">

          <q-item-section side>
            <q-icon name="keyboard_arrow_right"/>
          </q-item-section>
          <q-menu anchor="top end" self="top start">
            <q-list>
              <q-item v-if="tabset.sharing === TabsetSharing.UNSHARED"
                      dense clickable v-close-popup @click="shareTabsetPubliclyDialog(tabset)">
                <q-item-section>Share publicly</q-item-section>
              </q-item>
              <q-item v-if="tabset.sharing === TabsetSharing.PUBLIC_OUTDATED"
                      dense clickable v-close-popup @click="shareTabsetPubliclyDialog(tabset, true)">
                <q-item-section>Republish shared tabset</q-item-section>
              </q-item>
              <q-item v-if="tabset.sharing === TabsetSharing.PUBLIC || tabset.sharing === TabsetSharing.PUBLIC_OUTDATED"
                      @click="openPublicShare(tabset.id)"
                      clickable v-close-popup>
                <q-item-section>Open public page</q-item-section>
              </q-item>
              <q-item v-if="tabset.sharing === TabsetSharing.PUBLIC || tabset.sharing === TabsetSharing.PUBLIC_OUTDATED"
                      @click="copyPublicShareToClipboard(tabset.id)"
                      clickable v-close-popup>
                <q-item-section>Copy public page link</q-item-section>
              </q-item>
              <q-item v-if="tabset.sharing === TabsetSharing.PUBLIC || tabset.sharing === TabsetSharing.PUBLIC_OUTDATED"
                      clickable v-close-popup
                      @click="removePublicShare(tabset.id)">
                <q-item-section>Remove public share</q-item-section>
              </q-item>


            </q-list>
          </q-menu>

        </ContextMenuItem>

      </template>

      <template v-if="usePermissionsStore().hasFeature(FeatureIdent.WINDOW_MANAGEMENT)">
        <q-separator/>
        <ContextMenuItem
            icon="o_grid_view"
            label="Open in window...">

          <q-item-section side>
            <q-icon name="keyboard_arrow_right"/>
          </q-item-section>
          <q-menu anchor="top end" self="top start">
            <q-list>
              <q-item v-for="window in useWindowsStore().windowSet"
                      @click="changeWindow(tabset, window)"
                  dense clickable v-close-popup :disable="tabset.window === window">
                <q-item-section>{{ window }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item @click="openNewWindowDialog()" dense clickable v-close-popup>
                <q-item-section>Create New...</q-item-section>
              </q-item>
            </q-list>
          </q-menu>

        </ContextMenuItem>

      </template>

      <template v-if="useSettingsStore().isEnabled('dev')">
        <q-separator/>
        <ContextMenuItem v-close-popup
                         @was-clicked="useSearchStore().reindexTabset(tabset.id)"
                         icon="o_note"
                         label="Re-Index Search"/>
      </template>

      <q-separator/>
      <template v-if="tabset.status === TabsetStatus.DEFAULT">
        <ContextMenuItem v-close-popup
                         @was-clicked="pin(tabset)"
                         icon="o_push_pin"
                         color="warning"
                         label="Pin"/>
      </template>
      <template v-else-if="tabset.status === TabsetStatus.FAVORITE">
        <ContextMenuItem v-close-popup
                         @was-clicked="unpin(tabset)"
                         icon="push_pin"
                         color="warning"
                         label="Unpin"/>

      </template>

      <template v-if="usePermissionsStore().hasFeature(FeatureIdent.ARCHIVE_TABSET) &&
        tabset.status === TabsetStatus.DEFAULT">
        <q-separator/>
        <ContextMenuItem
            v-close-popup
            @was-clicked="archiveTabset(tabset)"
            icon="o_inventory_2"
            color="warning"
            label="Archive"/>
      </template>

      <q-separator/>

      <ContextMenuItem v-close-popup
                       @was-clicked="deleteTabsetDialog(tabset as Tabset)"
                       icon="o_delete"
                       color="negative"
                       label="Delete Tabset"/>

    </q-list>
  </q-menu>

</template>

<script lang="ts" setup>

import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {Tabset, TabsetSharing, TabsetStatus} from "src/models/Tabset";
import {useSettingsStore} from "stores/settingsStore";
import {useSearchStore} from "stores/searchStore";
import NavigationService from "src/services/NavigationService";
import EditTabsetDialog from "components/dialogues/EditTabsetDialog.vue";
import {openURL, useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {RestoreTabsetCommand} from "src/domain/tabsets/RestoreTabset";
import {MarkTabsetAsFavoriteCommand} from "src/domain/tabsets/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import ContextMenuItem from "pages/sidepanel/helper/ContextMenuItem.vue";
import {PropType} from "vue";
import {UnShareTabsetCommand} from "src/domain/tabsets/UnShareTabset";
import {useTabsetService} from "src/services/TabsetService2";
import {Tab} from "src/models/Tab";
import {CopyToClipboardCommand} from "src/domain/commands/CopyToClipboard";
import ShareTabsetPubliclyDialog from "components/dialogues/ShareTabsetPubliclyDialog.vue";
import {MarkTabsetAsArchivedCommand} from "src/domain/tabsets/MarkTabsetAsArchived";
import {useWindowsStore} from "stores/windowsStores";
import {useTabsStore} from "stores/tabsStore";
import TabsetService from "src/services/TabsetService";
import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useSpacesStore} from "stores/spacesStore";
import NewWindowDialog from "components/dialogues/NewWindowDialog.vue";

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()

const props = defineProps({
  tabset: {type: Object as PropType<Tabset>, required: true}
})

//const publictabsetsPath = "https://tabsets.web.app/#/tabsets/"
const publictabsetsPath = "https://public.tabsets.net/tabsets/"

const startTabsetNote = (tabset: Tabset) => {
  const url = chrome.runtime.getURL('www/index.html') + "#/mainpanel/notes/?tsId=" + tabset.id + "&edit=true"
  NavigationService.openOrCreateTab(url)
}

const openEditTabsetDialog = (tabset: Tabset) => {
  $q.dialog({
    component: EditTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name,
      fromPanel: true
    }
  })
}

const restoreInNewWindow = (tabsetId: string) => useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId))

const restoreInGroup = (tabsetId: string) => useCommandExecutor().execute(new RestoreTabsetCommand(tabsetId, false))

const pin = (tabset: Tabset) =>
    useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(tabset.id))

const unpin = (tabset: Tabset) =>
    useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(tabset.id))

const removePublicShare = (tabsetId: string) => useCommandExecutor().executeFromUi(new UnShareTabsetCommand(tabsetId))

const openPublicShare = (tabsetId: string) => {
  const ts = useTabsetService().getTabset(tabsetId)
  if (ts && ts.sharedId) {
    openURL(getPublicTabsetLink(ts))
  }
}

const copyPublicShareToClipboard = (tabsetId: string) => {
  const ts = useTabsetService().getTabset(tabsetId)
  if (ts && ts.sharedId) {
    useCommandExecutor().executeFromUi(new CopyToClipboardCommand(getPublicTabsetLink(ts)))
  }
}

const getPublicTabsetLink = (ts: Tabset) => {
  let image = "https://tabsets.web.app/favicon.ico"
  if (ts && ts.sharedId) {
    ts.tabs.reverse().forEach((t: Tab) => {
      if (t.image) {
        image = t.image
      }
    })
    return publictabsetsPath + ts.sharedId + "?n=" + btoa(ts.name) + "&i=" + btoa(image)
  }
  return image
}

const archiveTabset = (tabset: Tabset) =>
    useCommandExecutor().executeFromUi(new MarkTabsetAsArchivedCommand(tabset.id))

const changeWindow = (tabset:Tabset, window: string) => {
  tabset.window = window
  useTabsetService().saveTabset(tabset)
}

const deleteTabsetDialog = (tabset: Tabset) => {
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name
    }
  })
}

const shareTabsetPubliclyDialog = (tabset: Tabset, republish: boolean = false) => {
  $q.dialog({
    component: ShareTabsetPubliclyDialog,
    componentProps: {
      tabsetId: tabset.id,
      sharedId: tabset.sharedId,
      tabsetName: tabset.name,
      republish: republish
    }
  })
}

const openNewWindowDialog = () => {
  $q.dialog({
    component: NewWindowDialog,
    componentProps: {
      tabsetId: useTabsStore().currentTabsetId,
      spaceId: useSpacesStore().space?.id,
      fromPanel: true
    }
  })
}

</script>
