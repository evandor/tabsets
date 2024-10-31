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
          <q-item clickable v-for="c in projects" @click="selectCollection(c as Tabset)">
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
    </div>


    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <SidePanelCollectionsPageToolbar :show-search-box="false"/>
    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import {useUtils} from "src/core/services/Utils";
import {useUiStore} from "src/ui/stores/uiStore";
import Analytics from "src/core/utils/google-analytics";
import {useI18n} from 'vue-i18n'
import {Tabset, TabsetStatus} from "src/tabsets/models/Tabset";
import _ from "lodash"
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {SelectTabsetCommand} from "src/tabsets/commands/SelectTabset";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ExecutionFailureResult, ExecutionResult} from "src/core/domain/ExecutionResult";
import {useRouter} from "vue-router";
import FirstToolbarHelper2 from "pages/sidepanel/helper/FirstToolbarHelper2.vue";
import SidePanelCollectionPageToolbar from "pages/sidepanel/helper/SidePanelCollectionPageToolbar.vue";
import SidePanelCollectionsPageToolbar from "pages/sidepanel/helper/SidePanelCollectionsPageToolbar.vue";

const {t} = useI18n({locale: navigator.language, useScope: "global"})

const {inBexMode} = useUtils()

const router = useRouter()

const uiStore = useUiStore()

const view = ref('projects')
const tabsets = ref<Tabset[]>([])

const projects = ref<Tabset[]>([])
const project = ref('')

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

watchEffect(async () => {
  projects.value = [...useTabsetsStore().tabsets.values()]
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

function determineTabsets() {
  return _.sortBy(
    _.filter([...useTabsetsStore().tabsets.values()] as Tabset[],
      (ts: Tabset) => ts.status !== TabsetStatus.DELETED
        && ts.status !== TabsetStatus.HIDDEN &&
        ts.status !== TabsetStatus.ARCHIVED),
    getTabsetOrder, ["asc"]);
}

watchEffect(() => {
  tabsets.value = determineTabsets()
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
</script>

<style lang="scss">

.fitpage {
  height: calc(100vh - 130px);
}

</style>
