<template>
  <div class="row q-py-xs">
    <div class="col-11">
      <span v-if="lastTabsets.length < 2" style="font-size: smaller; color: grey" class="q-mx-xs"
        >current tabsets:
      </span>
      <q-badge
        class="q-ma-none q-ma-xs"
        v-for="t in lastTabsets"
        :class="t.id === useTabsetsStore().currentTabsetId ? '' : 'cursor-pointer'"
        :color="t.id === useTabsetsStore().currentTabsetId ? 'grey' : 'warning'"
        outline
        @click="useTabsetService().selectTabset(t.id)"
      >
        {{ t.name }}
        <q-icon
          :name="t.status === TabsetStatus.FAVORITE ? 'o_star' : 'sym_o_star'"
          @click.stop="toggleFavorite(t)"
        />
      </q-badge>
    </div>
    <div class="col">
      <q-icon name="more_vert" size="sm" color="secondary" class="cursor-pointer" />
      <q-menu :offset="[0, 0]" anchor="top right" self="bottom right">
        <q-list dense style="min-width: 180px">
          <ContextMenuItem
            v-close-popup
            :dense="true"
            icon="close"
            @click="closeTabsetListWidget()"
            label="Close"
          />
        </q-list>
      </q-menu>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { DeactivateFeatureCommand } from 'src/features/commands/DeactivateFeatureCommand'
import { MarkTabsetAsDefaultCommand } from 'src/tabsets/commands/MarkTabsetAsDefault'
import { MarkTabsetAsFavoriteCommand } from 'src/tabsets/commands/MarkTabsetAsFavorite'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import { ref, watchEffect } from 'vue'

const lastTabsets = ref<Pick<Tabset, 'id' | 'name' | 'status'>[]>([])

watchEffect(() => {
  if (useTabsetsUiStore().lastUpdate) {
    const lastTsIds = useTabsetsUiStore().lastUsedTabsets
    lastTabsets.value = lastTsIds.map((tsId: string) => {
      const ts = useTabsetsStore().getTabset(tsId)
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
</script>
