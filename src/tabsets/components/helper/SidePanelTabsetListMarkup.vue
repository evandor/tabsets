<template>
  <div class="row q-py-xs">
    <div class="col-11 ellipsis">
      <span v-if="lastTabsets.length < 2" style="font-size: smaller; color: grey" class="q-mx-xs">
        current tabsets will be displayed here once you switch
      </span>
      <q-badge
        class="q-ma-none q-ma-xs"
        v-for="t in lastTabsets"
        :class="t.id === currentTabsetId ? '' : 'cursor-pointer'"
        :color="t.id === currentTabsetId ? 'grey' : 'warning'"
        outline
        @click="useTabsetService().selectTabset(t.id)">
        {{ t.name }}
        <q-icon :name="t.status === TabsetStatus.FAVORITE ? 'o_star' : 'sym_o_star'" @click.stop="toggleFavorite(t)" />
      </q-badge>
    </div>
    <div class="col">
      <q-icon name="keyboard_arrow_down" size="sm" color="secondary" class="cursor-pointer" @click="hideTabsetList()" />
      <!--      <q-menu :offset="[0, 0]" anchor="top right" self="bottom right">
        <q-list dense style="min-width: 180px">
          <ContextMenuItem
            v-close-popup
            :dense="true"
            icon="keyboard_arrow_down"
            @click="closeTabsetListWidget()"
            label="Close" />
        </q-list>
      </q-menu>-->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { DeactivateFeatureCommand } from 'src/features/commands/DeactivateFeatureCommand'
import { MarkTabsetAsDefaultCommand } from 'src/tabsets/commands/MarkTabsetAsDefault'
import { MarkTabsetAsFavoriteCommand } from 'src/tabsets/commands/MarkTabsetAsFavorite'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'

const lastTabsets = ref<Pick<Tabset, 'id' | 'name' | 'status'>[]>([])
const currentTabsetId = ref<string | undefined>(undefined)

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (currentTabsetId.value = tsId))
})

watchEffect(() => {
  if (useTabsetsUiStore().lastUpdate) {
    const lastTsIds = useTabsetsUiStore().lastUsedTabsets
    lastTabsets.value = lastTsIds
      .map((tsId: string) => useTabsetsStore().getTabset(tsId))
      .filter((ts: Tabset | undefined) => ts != undefined)
      .map((ts: Tabset) => {
        return {
          id: ts?.id || '',
          name: ts?.name || '',
          status: ts?.status || TabsetStatus.DEFAULT,
        }
      })
  }
})

const toggleFavorite = (t: Pick<Tabset, 'id' | 'name' | 'status'>) => {
  if (t.status !== TabsetStatus.FAVORITE) {
    useCommandExecutor().executeFromUi(new MarkTabsetAsFavoriteCommand(t.id))
  } else {
    useCommandExecutor().executeFromUi(new MarkTabsetAsDefaultCommand(t.id))
  }
  useTabsetsUiStore().load()
}

const closeTabsetListWidget = () => {
  useCommandExecutor().executeFromUi(new DeactivateFeatureCommand(FeatureIdent.TABSET_LIST))
}

const hideTabsetList = () => {
  useUiStore().hideTabsetList(true)
}
</script>
