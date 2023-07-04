<template>

  <q-page padding style="padding-top: 45px">

    <div class="q-ma-none">

      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">

            <q-list>
              <q-item v-for="(tag,index) in tags.keys()"
                      dense-toggle dense hide-expand-icon
                      class="darken-on-hover"
                      header-class="q-ma-none q-pa-none q-ml-md q-mb-xs">

                <q-item-section class="cursor-pointer q-ma-none q-pa-none"
                                @click="selectTag(tag)">
                  <q-item-label>
                    <template v-slot>

                      <div class="row">
                        <div class="col-10 ellipsis">
                          {{ tag }}
                        </div>
                      </div>
                    </template>
                  </q-item-label>

                </q-item-section>
                <q-item-section class="text-right q-mx-sm cursor-pointer"
                                @mouseover="hoveredTag = tag"
                                @mouseleave="hoveredTag = undefined"
                                style="max-width:25px;font-size: 12px;color:#bfbfbf">
            <span v-if="hoveredOver(tag)">
              <q-icon name="more_horiz" color="primary" size="16px"/>
            </span>
                  <span v-else>
                {{ tags.get(tag) }}
            </span>
                  <q-menu :offset="[0, 0]">
                    <q-list dense style="min-width: 200px">

                      <q-item
                        clickable v-close-popup @click="createDynamicTabsetFrom(tag)">
                        Turn into (dynamic) tabset
                      </q-item>

                      <!--                <q-separator/>-->
                      <!--                <q-item clickable v-close-popup>-->
                      <!--                  Delete Tag in all Tabs-->
                      <!--                </q-item>-->
                    </q-list>
                  </q-menu>
                </q-item-section>

              </q-item>

            </q-list>

          </div>
        </div>

      </div>

    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" style="background-color:white">
      <FirstToolbarHelper title="Tags List" :show-back-button="true"/>
    </q-page-sticky>

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
import PanelTabListElementWidget from "components/widgets/PanelTabListElementWidget.vue";
import FirstToolbarHelper from "pages/sidepanel/helper/FirstToolbarHelper.vue";
import SecondToolbarHelper from "pages/sidepanel/helper/SecondToolbarHelper.vue";

const {handleError, handleSuccess} = useNotificationHandler()
const {inBexMode} = useUtils()

const router = useRouter()
const tabsStore = useTabsStore()

const tags = ref<Map<string, number>>(new Map())
const $q = useQuasar();
const localStorage = $q.localStorage

watchEffect(() => {
  console.log("calculating tags")
  tags.value = new Map()
  _.forEach([...tabsStore.tabsets.values()], (tabset: Tabset) => {
    _.forEach(tabset.tabs, (tab: Tab) => {
      _.forEach(tab.tags, (tag: string) => {
        const newCount = (tags.value.get(tag) || 0) + 1
        tags.value.set(tag, newCount)
      })
    })
  })
  tags.value = new Map([...tags.value.entries()].sort((a, b) => b[1] - a[1]));
})

const hoveredTag = ref<string | undefined>(undefined)
const hoveredOver = (tag: string) => hoveredTag.value === tag

const selectTag = (tag: string) => {
  console.log("selecting", tag)
  useUiStore().setSelectedTag(tag)
  // router.push("/sidepanel/tags")
  useUiStore().sidePanelSetActiveView(SidePanelView.TAG)
}

const createDynamicTabsetFrom = (tag: string) =>
  useCommandExecutor().executeFromUi(new CreateDynamicTabset(tag))

</script>
