<template>
  <q-page>
    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-2">
              <q-icon name="chevron_left" class="cursor-pointer" @click="useUiStore().sidePanelSetActiveView(SidePanelView.MAIN)">
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col-10" style="font-size:smaller">
              RSS Feeds
            </div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="q-ma-none q-pa-xs" style="max-width:300px">

      <div
        class="col-12 q-pa-xs items-center justify-center"
        v-for="rssTab in rssTabs">

        <q-card flat @click="open(rssTab)">
          <q-card-section class="q-pt-xs cursor-pointer">
            <div class="row items-baseline">
              <div class="col-2">
                <TabFaviconWidget :tab="rssTab" width="20px" height="20px" />
              </div>
              <div class="col-9 text-body2 ellipsis">
                {{ rssTab.chromeTab?.title }}
              </div>
              <div class="col-1">
                <q-icon name="close"/>
              </div>
            </div>

          </q-card-section>
        </q-card>
      </div>


    </div>
  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useRouter} from "vue-router";
import {useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {useNotificationHandler} from "src/services/ErrorHandler";
import {useUtils} from "src/services/Utils";
import _ from "lodash"
import {Tab} from "src/models/Tab";
import {SidePanelView, useUiStore} from "src/stores/uiStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {CreateDynamicTabset} from "src/domain/commands/CreateDynamicTabset";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";

const {handleError, handleSuccess} = useNotificationHandler()
const {inBexMode} = useUtils()

const router = useRouter()
const tabsStore = useTabsStore()

const tags = ref<Map<string, number>>(new Map())
const $q = useQuasar();
const localStorage = $q.localStorage

const rssTabs = ref<Tab[]>([])

watchEffect(() => rssTabs.value = tabsStore.rssTabs)


const open = (tab: Tab) => {
  if (tab.chromeTab?.url) {
    router.push("/sidepanel/rss/" + btoa(tab.chromeTab?.url))
  }
}

</script>
