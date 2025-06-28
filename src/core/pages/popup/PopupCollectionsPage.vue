<template>
  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 55px">
    <div class="row q-ma-none q-pa-none fit" :class="topLevelSubfolderExist() ? 'q-ml-md' : ''">
      <Draggable
        v-if="treeData"
        class="q-pl-none"
        v-model="treeData"
        @change="ondrop2($event)"
        :treeLine="false"
        :tree-line-offset="0"
        :defaultOpen="true"
        :indent="25">
        <template #default="{ node, stat }">
          <!--          <div class="row fit" style="width: 100%; border: 1px solid green">-->
          <!--            <div class="col-2" style="border: 1px solid brown">-->
          <!--              ***-->
          <!--              <q-icon :name="openIndicatorIcon(stat)" @click="stat.open = !stat.open" />-->
          <!--            </div>-->
          <!--            <div class="col">y</div>-->
          <!--          </div>-->
          <q-icon :name="openIndicatorIcon(stat)" @click="stat.open = !stat.open" />
          <span
            class="mtl-ml cursor-pointer"
            @click.stop="handleTreeClick(node, '/popup')"
            style="border: 0 solid blue; display: inline-block; min-width: 300px !important">
            <q-icon
              v-if="node.level == 0 && node.type === TabsetType.SESSION"
              name="sym_o_new_window"
              color="secondary"
              class="q-mx-sm" />
            <q-icon
              v-else-if="node.level == 0 && node.type === TabsetType.SPECIAL"
              name="o_folder_special"
              color="grey-6"
              class="q-mx-sm" />
            <q-icon
              v-else-if="node.level == 0 && node.type !== TabsetType.SESSION"
              name="o_tab"
              color="primary"
              class="q-mx-sm" />
            <q-icon v-else name="o_folder" color="warning" class="q-mx-sm" />
            <Highlight :filter="filter" :text="node.text + ' ' + (node.id === currentTabset?.id ? ' (current)' : '')" />
          </span>
          <q-icon name="more_vert" class="cursor-pointer">
            <q-menu anchor="bottom end" self="top end">
              <DeleteTabsetAction :tabset="tabsetFor(node.id)" level="root" element="popup" />
              <q-list dense style="min-width: 100px">
                <q-item clickable v-close-popup @click="deleteCollection(node.id)">
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-icon>
        </template>
      </Draggable>
    </div>
    <div v-if="mode == 'default'" class="row q-ml-lg q-mt-sm cursor-pointer text-grey-8">
      <div class="col-1" style="max-width: 23px">
        <q-icon name="add"></q-icon>
      </div>
      <div class="col-10">
        <span>Add Collection</span>
        <q-popup-edit v-model="newCollection" :validate="(val) => val.length > 0" v-slot="scope">
          <q-input
            autofocus
            dense
            v-model="scope.value"
            hint="new Collection Name"
            :rules="[(val) => scope.validate(val) || 'More than 5 chars required']">
            <template v-slot:after>
              <q-btn flat dense color="negative" icon="cancel" @click.stop.prevent="scope.cancel" />
              <q-btn
                flat
                dense
                color="positive"
                icon="check_circle"
                @click.stop.prevent="scope.set"
                :disable="!scope.validate(scope.value) || scope.initialValue === scope.value" />
            </template>
          </q-input>
        </q-popup-edit>
      </div>
    </div>

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode q-ma-none q-ml-md">
      <PopupToolbar title="Collections">
        <template v-slot:left>
          <q-icon name="o_keyboard_return" class="cursor-pointer" @click="router.push('/popup')" />
        </template>
      </PopupToolbar>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { Draggable } from '@he-tree/vue'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import '@he-tree/vue/style/default.css'
import { NodeTreeObject, useTabsetsFunctions } from 'src/core/pages/common/useTabsetsFunctions'
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import DeleteTabsetAction from 'src/tabsets/actions/DeleteTabsetAction.vue'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import Highlight from 'src/tabsets/widgets/Highlight.vue'

const router = useRouter()

const { ondrop2, removeNonMatches, openIndicatorIcon, handleTreeClick, getTreeData, tabsetsForSpace } =
  useTabsetsFunctions()

const tabsets = ref<Tabset[]>([])
const treeData = ref<NodeTreeObject[]>()
const currentTabset = ref<Tabset | undefined>(undefined)
const filter = ref<string | undefined>(undefined)
const mode = ref<'default' | 'addCollection'>('default')
const newCollection = ref<string>('')

onMounted(() => {
  Analytics.firePageViewEvent('PopupCollectionsPage', document.location.href)
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  if (tabsets.value && tabsets.value.length > 0) {
    treeData.value = getTreeData(tabsets.value)
    if (filter.value && filter.value.trim() !== '') {
      treeData.value = removeNonMatches(treeData.value, filter.value)
    }
  }
})

watchEffect(() => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = tabsetsForSpace(currentSpace)
  } else {
    //console.log("loading from ", [...useTabsetsStore().tabsets.values()])
    tabsets.value = [...useTabsetsStore().tabsets.values()]
  }
})

const topLevelSubfolderExist = () =>
  treeData.value
    ? treeData.value.findIndex((nto: NodeTreeObject) => nto.children && nto.children.length > 0) >= 0
    : false

watchEffect(() => {
  if (newCollection.value.trim().length > 0) {
    console.log('new', newCollection.value)
    useCommandExecutor().executeFromUi(new CreateTabsetCommand(newCollection.value, []))
  }
})

const tabsetFor = (tabsetId: string) => {
  return useTabsetsStore().getTabset(tabsetId)!
}
const deleteCollection = (tabsetId: string) => {
  console.log('deleting', tabsetId)
}
</script>

<style lang="scss">
.fitpage {
  height: calc(100vh - 130px);
}
</style>

<script setup lang="ts"></script>
