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

      <!--      <q-item clickable v-close-popup @click.stop="openEditTabsetDialog(tabset as Tabset)">-->
      <!--        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">-->
      <!--          <q-icon size="xs" name="o_note" color="accent"/>-->
      <!--        </q-item-section>-->
      <!--        <q-item-section>-->
      <!--          Edit Tabset Name-->
      <!--        </q-item-section>-->
      <!--      </q-item>-->

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

<!--      <template v-if="tabset.tabs.length > 0 && inBexMode()">-->
<!--        <q-separator/>-->
<!--        <q-item clickable>-->
<!--          <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">-->
<!--            <q-icon size="xs" name="open_in_new" color="accent"/>-->
<!--          </q-item-section>-->
<!--          <q-item-section>Open all in...</q-item-section>-->
<!--          <q-item-section side>-->
<!--            <q-icon name="keyboard_arrow_right"/>-->
<!--          </q-item-section>-->

<!--          <q-menu anchor="top end" self="top start">-->
<!--            <q-list>-->
<!--              <q-item dense clickable @click="restoreInNewWindow(tabset.id)">-->
<!--                <q-item-section>new window</q-item-section>-->
<!--              </q-item>-->
<!--              <q-item dense clickable @click="restoreInGroup(tabset.id)">-->
<!--                <q-item-section>current window</q-item-section>-->
<!--              </q-item>-->
<!--            </q-list>-->
<!--          </q-menu>-->

<!--        </q-item>-->
<!--      </template>-->

      <template v-if="useSettingsStore().isEnabled('dev')">
        <q-separator/>
        <ContextMenuItem v-close-popup
          @was-clicked="useSearchStore().reindexTabset(tabset.id)"
          icon="o_note"
          label="Re-Index Search"/>
      </template>

      <!--      <q-item v-if="useSettingsStore().isEnabled('dev')"-->
      <!--              clickable v-close-popup @click.stop="useSearchStore().reindexTabset(tabset.id)">-->
      <!--        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">-->
      <!--          <q-icon size="xs" name="o_note" color="accent"/>-->
      <!--        </q-item-section>-->
      <!--        <q-item-section>-->
      <!--          Re-Index Search-->
      <!--        </q-item-section>-->
      <!--      </q-item>-->
      <!--      -->

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

      <!--      <q-item v-if="tabset.status === TabsetStatus.DEFAULT"-->
      <!--              clickable v-close-popup @click.stop="pin(tabset as Tabset)">-->
      <!--        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">-->
      <!--          <q-icon size="xs" name="o_push_pin" color="warning"/>-->
      <!--        </q-item-section>-->
      <!--        <q-item-section>-->
      <!--          Pin-->
      <!--        </q-item-section>-->
      <!--      </q-item>-->
      <!--      <q-item v-if="tabset.status === TabsetStatus.FAVORITE"-->
      <!--              clickable v-close-popup @click.stop="unpin(tabset as Tabset)">-->
      <!--        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">-->
      <!--          <q-icon size="xs" name="push_pin" color="warning"/>-->
      <!--        </q-item-section>-->
      <!--        <q-item-section>-->
      <!--          Unpin-->
      <!--        </q-item-section>-->
      <!--      </q-item>-->

      <q-separator/>

      <ContextMenuItem v-close-popup
        @was-clicked="deleteTabsetDialog(tabset as Tabset)"
        icon="o_delete"
        color="negative"
        label="Delete Tab"/>

      <!--      <q-item clickable v-close-popup @click.stop="deleteTabsetDialog(tabset as Tabset)">-->
      <!--        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">-->
      <!--          <q-icon size="xs" name="o_delete" color="negative"/>-->
      <!--        </q-item-section>-->
      <!--        <q-item-section>-->
      <!--          Delete Tab-->
      <!--        </q-item-section>-->
      <!--      </q-item>-->
    </q-list>
  </q-menu>

</template>

<script lang="ts" setup>

import {usePermissionsStore} from "stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import {useSettingsStore} from "stores/settingsStore";
import {useSearchStore} from "stores/searchStore";
import NavigationService from "src/services/NavigationService";
import EditTabsetDialog from "components/dialogues/EditTabsetDialog.vue";
import {useQuasar} from "quasar";
import {useUtils} from "src/services/Utils";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {RestoreTabsetCommand} from "src/domain/tabsets/RestoreTabset";
import {MarkTabsetAsFavoriteCommand} from "src/domain/tabsets/MarkTabsetAsFavorite";
import {MarkTabsetAsDefaultCommand} from "src/domain/tabsets/MarkTabsetAsDefault";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import ContextMenuItem from "pages/sidepanel/helper/ContextMenuItem.vue";
import {PropType} from "vue";

const {inBexMode, sanitize, sendMsg} = useUtils()

const $q = useQuasar()

const props = defineProps({
  tabset: {type: Object as PropType<Tabset>, required: true}
})

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

const deleteTabsetDialog = (tabset: Tabset) => {
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name
    }
  })
}

</script>
