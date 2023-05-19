<template>
  <q-menu :offset="[0, 0]">
    <q-list dense style="min-width: 200px">
      <q-separator/>
      <q-item clickable v-close-popup @click.stop="deleteTab(props.tab)">
        <q-icon name="o_delete" class="q-my-xs q-mr-xs" color="grey-5" style="position:relative;top:-1px"/>
        Delete tab
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
import {useSpacesStore} from "src/stores/spacesStore";
import _ from "lodash";
import {useTabsetService} from "src/services/TabsetService2";
import {useQuasar} from "quasar";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";
import {StopSessionCommand} from "src/domain/commands/StopSessionCommand";
import {useUiService} from "src/services/useUiService";
import {DrawerTabs} from "stores/uiStore";
import {CopyTabsetCommand} from "src/domain/tabsets/CopyTabset";
import {RestoreTabsetCommand} from "src/domain/tabsets/RestoreTabset";
import {Tab} from "src/models/Tab";
import {DeleteTabCommand} from "src/domain/commands/DeleteTabCommand";

const {inBexMode} = useUtils()

const props = defineProps({
  tab: {
    type: Object as PropType<Tab>,
    required: true
  }
})

const emit = defineEmits(['toggleExpand']);

const $q = useQuasar()

const expanded = ref<boolean[]>([])

const toggleExpand = (index: number): void => {
  expanded.value[index] = !expanded.value[index]
  emit('toggleExpand', index)
}

const showDetails = (tabsetId: string) => useUiService().rightDrawerSetActiveTab(DrawerTabs.TABSET_DETAILS, {tabsetId})

const restoreDialog = (tabsetId: string) => $q.dialog({
  component: RestoreTabsetDialog,
  componentProps: {tabsetId: tabsetId}
})


const deleteTab = (tab: Tab) => useCommandExecutor().executeFromUi(new DeleteTabCommand(tab))


</script>
