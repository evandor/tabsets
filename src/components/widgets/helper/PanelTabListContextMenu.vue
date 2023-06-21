<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">
      <q-separator/>
      <q-item clickable v-close-popup @click.stop="showTabDetails(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_info" color="accent"/>
        </q-item-section>
        <q-item-section>
          Show Tab Details
        </q-item-section>
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click.stop="editNoteDialog(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_note" color="accent"/>
        </q-item-section>
        <q-item-section>
          Add / Edit Note
        </q-item-section>
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click.stop="deleteTab(props['tab' as keyof object])">
        <q-item-section avatar style="padding-right:0;min-width:25px;max-width: 25px;">
          <q-icon size="xs" name="o_delete" color="negative"/>
        </q-item-section>
        <q-item-section>
          Delete Tab
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts" setup>

import {PropType, ref} from "vue";
import {useUtils} from "src/services/Utils";
import {useCommandExecutor} from "src/services/CommandExecutor";
import RestoreTabsetDialog from "components/dialogues/RestoreTabsetDialog.vue";
import {useQuasar} from "quasar";
import {DrawerTabs, useUiStore} from "src/stores/uiStore";
import {Tab} from "src/models/Tab";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";
import EditNoteDialog from "components/dialogues/EditNoteDialog.vue";
import {useRouter} from "vue-router";

const {inBexMode} = useUtils()

const props = defineProps({
  tab: {
    type: Object as PropType<Tab>,
    required: true
  }
})

const emit = defineEmits(['toggleExpand']);

const $q = useQuasar()
const router = useRouter()

const expanded = ref<boolean[]>([])

const toggleExpand = (index: number): void => {
  expanded.value[index] = !expanded.value[index]
  emit('toggleExpand', index)
}

const showDetails = (tabsetId: string) => useUiStore().rightDrawerSetActiveTab(DrawerTabs.TABSET_DETAILS, {tabsetId})

const restoreDialog = (tabsetId: string) => $q.dialog({
  component: RestoreTabsetDialog,
  componentProps: {tabsetId: tabsetId}
})


const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))


const editNoteDialog = (tab: Tab) => $q.dialog({
  component: EditNoteDialog,
  componentProps: {tabId: tab.id, note: tab.note}
})

const showTabDetails = (tab: Tab) => {
  console.log("showing tab details for", tab)
  router.push("/sidepanel/tab/" + tab.id)
}

</script>
