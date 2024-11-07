<template>

  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 60px">

    <div class="row q-ma-none q-pa-none items-start">
              <span class="text-body2 q-ml-md">
                Select Collection
              </span>
      <div class="col-12">
        <hr style="height:1px;border:none;background-color: #efefef;">
      </div>

      <div class="col-12 q-my-lg">
        <q-list>
          <q-item clickable v-for="c in tabsets"
                  @click="selectCollection(c as Tabset)">
            <q-item-section>
              <q-item-label>
                <q-icon name="o_featured_play_list" class="q-mr-xs q-mb-xs"/>
                {{ c.name }}
              </q-item-label>
              <q-item-label caption lines="2">{{ c.headerDescription }}</q-item-label>
            </q-item-section>

            <!--                  <q-item-section side top>-->
            <!--                    <q-item-label caption>5 min ago</q-item-label>-->
            <!--                    <q-icon name="star" color="yellow" />-->
            <!--                  </q-item-section>-->
          </q-item>
        </q-list>
      </div>

      <div>
        <Draggable v-if="treeData"
                   class="mtl-tree q-pl-md" v-model="treeData" treeLine :tree-line-offset="0">
          <template #default="{ node, stat }">
            <OpenIcon
              v-if="stat.children.length"
              :open="stat.open"
              class="mtl-mr"
              @click.native="stat.open = !stat.open"
            />
            <span class="mtl-ml cursor-pointer" @click="handleTreeClick(node, level)">
              <q-icon v-if="node.level == 0" name="o_tab" color="warning" class="q-mx-sm" />
              <q-icon v-else name="o_folder" color="warning" class="q-mx-sm" />
              {{ node.text }}</span>
          </template>
        </Draggable>
      </div>

    </div>


    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <SidePanelCollectionsPageToolbar :show-search-box="false"/>
    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import {useUiStore} from "src/ui/stores/uiStore";
import Analytics from "src/core/utils/google-analytics";
import {useI18n} from 'vue-i18n'
import {Tabset, TabsetStatus} from "src/tabsets/models/Tabset";
import _ from "lodash"
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {SelectTabsetCommand} from "src/tabsets/commands/SelectTabset";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useRouter} from "vue-router";
import SidePanelCollectionsPageToolbar from "pages/sidepanel/helper/SidePanelCollectionsPageToolbar.vue";
import {useFeaturesStore} from "src/features/stores/featuresStore";
import {FeatureIdent} from "src/app/models/FeatureIdent";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {Draggable, OpenIcon} from "@he-tree/vue";
import '@he-tree/vue/style/default.css'

const {t} = useI18n({locale: navigator.language, useScope: "global"})

const router = useRouter()

const tabsets = ref<Tabset[]>([])
const treeData = ref<object[]>()

function updateOnlineStatus(e: any) {
  const {type} = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  // window.addEventListener('keypress', checkKeystroke);

  window.addEventListener("offline", (e) => updateOnlineStatus(e));
  window.addEventListener("online", (e) => updateOnlineStatus(e));

  Analytics.firePageViewEvent('SidePanelPage', document.location.href)
})

onUnmounted(() => {
  // window.removeEventListener('keypress', checkKeystroke);
})

function treeNodeFromNote(n: Tabset, level = 0): object {
  console.log("treeNodeFromNote", treeNodeFromNote)
  return {
    text: n.name,
    id: n.id,
    level,
    url: chrome.runtime.getURL(`/www/index.html#/mainpanel/notes/${n.id}`),
    children: _.map(n.folders, (f: Tabset) => {
      return treeNodeFromNote(f, level + 1)
    })
  }
}

watchEffect(async () => {
  if (tabsets.value && tabsets.value.length > 0) {
    console.log("tabsets.value", tabsets.value)
    treeData.value = _.map(tabsets.value, (f: Tabset) => {
      return treeNodeFromNote(f)
    })
  }
})

const getTabsetOrder =
  [
    function (o: Tabset) {
      return o.status === TabsetStatus.FAVORITE ? 0 : 1
    },
    function (o: Tabset) {
      return o.name?.toLowerCase()
    }
  ]

watchEffect(async () => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    console.log("currentspace", currentSpace)
    tabsets.value = _.sortBy(
      _.filter([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return ts.status !== TabsetStatus.DELETED &&
          ts.status !== TabsetStatus.HIDDEN &&
          ts.status !== TabsetStatus.ARCHIVED
      }),
      getTabsetOrder, ["asc"])
  } else {
    tabsets.value = [...useTabsetsStore().tabsets.values()]
  }
})

const selectCollection = (c: Tabset) => {
  console.log("found", c)
  useCommandExecutor().execute(new SelectTabsetCommand(c.id))//, useSpacesStore().space?.id))
    .then((res: ExecutionResult<Tabset | undefined>) => {
      if (res.result) {
        //currentProject.value = res.result
        router.push("/sidepanel")
      }
    })
}

const handleTreeClick = (node: any, level:number) => {
  console.log("clicked", node, level)
  if (level == 0) {
    selectCollection(node as Tabset)
  }
}

</script>

<style lang="scss">

.fitpage {
  height: calc(100vh - 130px);
}

</style>
