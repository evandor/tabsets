<template>

  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 60px">

    <!-- white main box -->
    <div class="column fitpage q-pa-sm q-mx-sm q-mt-md bg-white">
      <div class="col" style="max-width:100%;">

        <template v-if="view === 'projects'">
          <div class="row q-ma-none q-pa-none items-start">
<!--            <div class="col-6">-->
<!--              <span class="cursor-pointer text-subtitle1" v-if="projects.length > 0">-->
<!--                <q-icon name="o_sync_alt" color="primary" class="q-mr-sm" size="sm"/>Select Collection-->
<!--              </span>-->
<!--            </div>-->
<!--            <div class="col-6 text-right">-->
<!--              <span @click="view = 'new_project'" class="cursor-pointer text-subtitle1">-->
<!--                <q-icon name="o_add_circle" color="primary" class="q-mr-sm" size="sm"/>New Collection-->
<!--              </span>-->
<!--            </div>-->
            <div class="col-12">
              <hr style="height:1px;border:none;background-color: #efefef;">
            </div>

            <div class="col-12 q-my-lg">
              <q-list>
                <q-item clickable v-for="c in projects" @click="selectCollection(c as Tabset)">
                  <q-item-section>
                    <q-item-label>{{ c.name }}</q-item-label>
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

        </template>

        <!-- Formular for new/edit project -->
        <template v-if="view === 'new_project'">
          <div class="row q-ma-md q-pa-md">
            <div class="col-12">
              <ProjectForm @project-created="(e:any) => createProject(e)" @skip="view = 'projects'"/>
            </div>
          </div>
        </template>


        <!-- list of tabs, assuming here we have at least one tabset -->

      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <FirstToolbarHelper title="Bibbly" :show-search-box="projects.length > 0"/>
    </q-page-sticky>
  </q-page>

</template>

<script lang="ts" setup>

import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import {useUtils} from "src/core/services/Utils";
import {useUiStore} from "src/ui/stores/uiStore";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import Analytics from "src/core/utils/google-analytics";
import {useI18n} from 'vue-i18n'
import {Tabset, TabsetStatus} from "src/tabsets/models/Tabset";
import _ from "lodash"
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";
import {useSpacesStore} from "src/spaces/stores/spacesStore";
import {SelectTabsetCommand} from "src/tabsets/commands/SelectTabset";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {ExecutionFailureResult, ExecutionResult} from "src/core/domain/ExecutionResult";
import {CreateTabsetCommand} from "src/tabsets/commands/CreateTabsetCommand";
import {useRouter} from "vue-router";

const {t} = useI18n({locale: navigator.language, useScope: "global"})

const {inBexMode} = useUtils()

const router = useRouter()

const uiStore = useUiStore()

const view = ref('projects')
const tabsets = ref<Tabset[]>([])

const projects = ref<Tabset[]>([])
const project = ref('')
const currentProject = ref<Tabset | undefined>(undefined)
const projectOptions = ref<object[]>([])

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
  // projectOptions.value = []
  // _.forEach(projects.value as Tabset[], (p: Tabset) => {
  //   projectOptions.value.push({label: p.name, value: p.id})
  // })
  // projectOptions.value = _.sortBy(projectOptions.value, "label")
  // if (useTabsetsStore().currentTabsetName) {
  //   project.value = useTabsetsStore().currentTabsetName!
  //   //console.log("project.value", project.value)
  //   currentProject.value = useTabsetsStore().getCurrentTabset
  // }
})

const createProject = (e: object) =>
  useCommandExecutor().executeFromUi(new CreateTabsetCommand(e['name' as keyof object], []))
    .then((res: ExecutionResult<any>) => {
      if (res instanceof ExecutionFailureResult) {
        console.log("res", res)
      } else {
        view.value = 'projects'
        currentProject.value = res.result
        project.value = res.result.name
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
  useCommandExecutor().execute(new SelectTabsetCommand(c.id, useSpacesStore().space?.id))
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
