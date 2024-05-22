<template>

  <q-list style="max-width:95%">
    <q-item v-for="(tag,index) in tags.keys()"
            dense-toggle dense hide-expand-icon
            class="darken-on-hover"
            header-class="q-ma-none q-pa-none q-ml-md q-mb-xs">

      <q-item-section class="cursor-pointer q-ma-none q-pa-none"
                      @click="selectTag(tag)">
        <q-item-label>
          <template v-slot>

            <div class="row">
              <div class="col-12 ellipsis">
                <q-icon
                    color="primary"
                    name="o_label"
                    style="position: relative;top:-2px"/>
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

          </q-list>
        </q-menu>
      </q-item-section>

    </q-item>

  </q-list>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useQuasar} from "quasar";
import _ from "lodash";
import {Tabset, TabsetStatus, TabsetType} from "src/tabsets/models/Tabset";
import {Tab} from "src/tabsets/models/Tab";
import {useCommandExecutor} from "src/core/services/CommandExecutor";
import {useTabsetsStore} from "src/tabsets/stores/tabsetsStore";

const emit = defineEmits(['tagSelected']);

const tags = ref<Map<string, number>>(new Map())
const $q = useQuasar();

const hoveredTag = ref<string | undefined>(undefined)
const hoveredOver = (tag: string) => hoveredTag.value === tag

watchEffect(() => {
  console.log("calculating tags")
  tags.value = new Map()
  _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => {
    if (tabset.type === TabsetType.DEFAULT &&
        (tabset.status === TabsetStatus.DEFAULT || tabset.status === TabsetStatus.FAVORITE)) {
      _.forEach(tabset.tabs, (tab: Tab) => {
        _.forEach(tab.tags, (tag: string) => {
          const newCount = (tags.value.get(tag) || 0) + 1
          tags.value.set(tag, newCount)
        })
      })
    }
  })
  tags.value = new Map([...tags.value.entries()].sort((a, b) => b[1] - a[1]));
})

const createDynamicTabsetFrom = (tag: string) =>
    useCommandExecutor().executeFromUi(new CreateDynamicTabset(tag))

const selectTag = (tag: string) => emit('tagSelected', tag)

</script>
