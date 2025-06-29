<template>
  <div class="q-ma-none q-pa-none" style="max-width: 300px; border: 0 solid green">
    <q-list dense>
      <q-item v-for="(tabset, index) in tabsets" class="darken-on-hover">
        <q-item-section
          class="cursor-pointer q-ma-none q-pa-none"
          @drop="onDrop($event, tabset.id)"
          @dragover.prevent
          @dragenter.prevent
          :class="activeTabset === tabset.id ? 'active-list-element' : ''"
          @click="selectTS(tabset)">
          <q-item-label>
            <template v-slot>
              <div class="row">
                <div class="col-10 ellipsis">
                  <q-icon
                    name="stars"
                    color="warning"
                    class="q-ml-none q-mr-sm"
                    v-if="tabset.status === TabsetStatus.FAVORITE">
                    <q-tooltip class="tooltip">This tabset is marked as 'favorite'</q-tooltip>
                  </q-icon>
                  <q-icon
                    name="explore"
                    color="primary"
                    class="q-ml-none q-mr-sm"
                    v-if="tabset.type === TabsetType.SESSION">
                    <q-tooltip>This is a 'session' tabset, keeping track of your tabs automatically</q-tooltip>
                  </q-icon>
                  <q-icon name="share" color="primary" class="q-ml-none q-mr-sm" v-if="tabset.sharing?.sharedBy">
                    <q-tooltip>This tabset is shared by {{ tabset.sharing?.sharedBy }}</q-tooltip>
                  </q-icon>
                  <q-icon
                    name="build_circle"
                    color="primary"
                    class="q-ml-none q-mr-sm"
                    v-if="tabset.type === TabsetType.DYNAMIC">
                    <q-tooltip class="tooltip">The tabs of this tabset have been generated automatically</q-tooltip>
                  </q-icon>
                  {{ tabset.name }}
                </div>
              </div>
            </template>
          </q-item-label>
        </q-item-section>
        <q-item-section
          v-if="!useAuthStore().user?.isAnonymous"
          class="text-right cursor-pointer"
          @mouseover="hoveredTab = tabset.id"
          @mouseleave="hoveredTab = undefined"
          style="max-width: 25px; font-size: 12px">
          <span v-if="hoveredOver(tabset.id)">
            <q-icon name="more_horiz" color="primary" size="16px" />
          </span>
          <span v-else-if="tabset.type === TabsetType.DYNAMIC"> - </span>
          <span v-else>
            {{ tabset.tabs.length }}
          </span>

          <TabsetListContextMenu
            :tabset="tabset!"
            :index="index!"
            :hoveredTab="hoveredTab!"
            :viewPort="props.viewPort as ViewPort"
            @toggleExpand="(index: number) => toggleExpand(index)" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts" setup>
import { ViewPort } from 'src/core/models/ViewPort'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { MoveToTabsetCommand } from 'src/tabsets/commands/MoveToTabset'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsetsUiStore } from 'src/tabsets/stores/tabsetsUiStore'
import TabsetListContextMenu from 'src/tabsets/widgets/TabsetListContextMenu.vue'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const activeTabset = ref<string | undefined>(undefined)
const hoveredTab = ref<string | undefined>(undefined)

type Props = {
  tabsets: Tabset[]
  spaceId?: string | undefined
  viewPort: ViewPort
}

const props = withDefaults(defineProps<Props>(), {
  viewPort: 'sidepanel',
})

// const props = defineProps({
//   tabsets: { type: Array as PropType<Array<Tabset>>, required: true },
//   spaceId: { type: String, required: false },
//   viewPort: { type: Object as PropType<ViewPort>, default: false },
// })

onMounted(async () => {
  activeTabset.value = await useTabsetsStore().getCurrentTabsetId()
})

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (activeTabset.value = tsId))
})

const selectTS = (tabset: Tabset) => {
  console.log('selecting tabset/space', tabset.id, props.spaceId)
  useSpacesStore().setSpace(props.spaceId)
  useCommandExecutor()
    .execute(new SelectTabsetCommand(tabset.id))
    .then(() => {})
    .then(() => {
      useTabsetsUiStore().addTabsetToLastUsedList(tabset.id)
    })
    .then(() => {
      console.log('tabset was selected', tabset.id, tabset.type, props.viewPort)
      activeTabset.value = tabset.id
      switch (props.viewPort) {
        case 'sidepanel':
          if (tabset.type === TabsetType.DYNAMIC) {
            router.push('/sidepanel/dynamicTs/' + tabset.id)
          } else {
            router.push('/sidepanel')
          }
          break
        case 'mainpanel':
          if (tabset.type === TabsetType.DYNAMIC) {
            router.push('/dynamicTs/' + tabset.id)
          } else {
            router.push('/sidepanel/tabsets/' + tabset.id)
          }
          break
        case 'fullpage':
          router.push('/fullpage/tabsets/' + tabset.id)
      }

      // if (!props.fromPanel) {
      //   if (tabset.type === TabsetType.DYNAMIC) {
      //     router.push('/dynamicTs/' + tabset.id)
      //   } else {
      //     router.push('/tabsets/' + tabset.id)
      //   }
      // } else {
      //   if (tabset.type === TabsetType.DYNAMIC) {
      //     router.push('/sidepanel/dynamicTs/' + tabset.id)
      //   } else {
      //     router.push('/sidepanel')
      //   }
      // }
    })
}

const onDrop = async (evt: DragEvent, tabsetId: string) => {
  const tabId = useUiStore().droppingTab()
  const currenTabsetId = await useTabsetsStore().getCurrentTabsetId()
  if (evt.dataTransfer && tabId && currenTabsetId) {
    useCommandExecutor().executeFromUi(new MoveToTabsetCommand(tabId, tabsetId, currenTabsetId, evt.shiftKey))
  }
}

const hoveredOver = (tabsetId: string) => hoveredTab.value === tabsetId

const toggleExpand = (index: any) => {
  console.warn('not implemented Q')
}
</script>

<style>
.q-expansion-item__content {
  border: 0 solid #f5f5f5;
}

.darken-on-hover:hover {
  background-color: #efefef !important;
}
</style>
