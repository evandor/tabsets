<template>
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10">
            Note {{ tab?.chromeTab?.title }}
          </div>
          <div class="col" v-if="!editMode" @click="editMode = true">
            Edit
          </div>
          <div class="col" v-else>
            Save
          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="row items-baseline q-ma-lg">
    <div class="col-2">
      <q-img
        class="rounded-borders"
        width="32px"
        height="32px"
        :src="tab?.chromeTab?.favIconUrl">
        <q-tooltip>
          {{ tab?.chromeTab?.favIconUrl }} / {{
            tab?.chromeTab?.id
          }} / {{ tab.id }}
        </q-tooltip>
      </q-img>
    </div>
    <div class="col-10">
      <hr>
    </div>

    <div class="col-2">
      Url
    </div>
    <div class="col-10">
      <div class="text-overline ellipsis-2-lines">
        {{ tab?.history[0] }}&nbsp;<q-icon name="launch" color="secondary"
                                           @click.stop="NavigationService.openOrCreateTab(tab?.history[0] || '' )"></q-icon>
      </div>
    </div>
  </div>

  <div class="row q-ma-none q-ma-lg">
    <div class="col-2 text-subtitle1">
      Description
    </div>
    <div class="col-6" v-if="!editMode">
      {{ tab?.description }}
    </div>
    <div class="col-6" v-else>
      <q-input type="textarea" :model-value="tab?.description"
               @update:model-value="val => update('description', val)"
      />
    </div>

    <div class="col">
      <div class="row">
        <div class="col-5 text-subtitle1">
          Created
        </div>
        <div class="col-7 text-subtitle2">
          {{ formatDate(tab?.created) }}
          <q-tooltip>
            {{ date.formatDate(tab?.created, 'DD.MM.YYYY HH:mm') }}
          </q-tooltip>
        </div>
        <div class="col-5 text-subtitle1">
          Updated
        </div>
        <div class="col-7 text-subtitle2">
          {{ formatDate(tab?.updated) }}
          <q-tooltip>
            {{ date.formatDate(tab?.updated, 'DD.MM.YYYY HH:mm') }}
          </q-tooltip>
        </div>
        <div class="col-5 text-subtitle1">

        </div>
        <div class="col-7 text-subtitle2">
          <q-btn v-if="markdown !== tab?.longDescription" label="save" @click="save"/>
        </div>
      </div>

    </div>
  </div>
  <div class="row q-ma-none q-ma-lg">
    <div class="col-2 text-subtitle1">
      Content
    </div>
    <div class="col">
      <q-splitter v-if="editMode"
                  v-model="splitterModel"
                  style="height: 500px;">
        <template #separator>
          <q-avatar
            color="primary"
            text-color="white"
            size="28px"
            icon="fas fa-arrows-alt-h"
          />
        </template>

        <template #before>
          <div class="q-pa-md">
            <textarea
              v-model="markdown"
              :rows="20"
              class="fit q-pa-sm"
            />
          </div>
        </template>

        <template #after>
          <div
            class="q-pa-md"
            style="height: 467px;">
            <q-markdown
              :key="count"
              v-model:src="markdown"
              :no-html="noHtml"
              :no-link="noLink"
              :no-linkify="noLinkify"
              :no-typographer="noTypographer"
              :no-breaks="noBreaks"
              :no-highlight="noHighlight"
              :no-image="noImage"
              :no-container="noContainer"
              :plugins="plugins"
              class="fit bordered q-pa-sm"
            />
          </div>
        </template>
      </q-splitter>
      <div v-else>
        <q-markdown
          :key="count"
          v-model:src="markdown"
          :no-html="noHtml"
          :no-link="noLink"
          :no-linkify="noLinkify"
          :no-typographer="noTypographer"
          :no-breaks="noBreaks"
          :no-highlight="noHighlight"
          :no-image="noImage"
          :no-container="noContainer"
          :plugins="plugins"
          class="fit bordered q-pa-sm"
        />
      </div>
    </div>

  </div>

</template>

<script lang="ts" setup>

import {inject, ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import NavigationService from "src/services/NavigationService";
import {date} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import {useUtils} from "src/services/Utils";
import '@quasar/quasar-ui-qmarkdown/dist/index.css'
import {useTabsetService} from "src/services/TabsetService2";
import _ from "lodash"
import {Tabset} from "src/models/Tabset";
// import markdownItMermaid from '@datatraccorporation/markdown-it-mermaid'

const {formatDate, sendMsg} = useUtils()

const route = useRoute()

const noteId = ref<string | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetId = ref<string | undefined>(undefined)
const editMode = ref(false)

const splitterModel = ref(50)
const markdown = ref('')
const noHtml = ref(false)
const noLink = ref(false)
const noLinkify = ref(false)
const noTypographer = ref(false)
const noBreaks = ref(false)
const noHighlight = ref(false)
const noEmoji = ref(false)
const noSubscript = ref(false)
const noSuperscript = ref(false)
const noFootnote = ref(false)
const noDeflist = ref(false)
const noAbbreviation = ref(false)
const noInsert = ref(false)
const noMark = ref(false)
const noImage = ref(false)
const noTasklist = ref(false)
const noContainer = ref(false)
const noMermaid = ref(false)
const plugins = ref([])
const count = ref(0)

watchEffect(() => {
  console.log("watched...")
  noteId.value = route.params.noteId as unknown as string
  const tabObject = useTabsStore().getTab(noteId.value)
  if (tabObject) {
    console.log("tabObject", tabObject)
    tab.value = tabObject['tab' as keyof object] as unknown as Tab
    markdown.value = tab.value?.longDescription || ''
    tabsetId.value = tabObject['tabsetId' as keyof object]
  }
})

const save = () => {
  if (tabsetId.value) {
    const tabset = useTabsetService().getTabset(tabsetId.value) as Tabset | undefined
    if (tabset && tab.value) {
      tab.value.longDescription = markdown.value
      console.log("saving note", tabset, tabsetId.value, markdown.value)
      // needed to update the note in the side panel
      sendMsg('tab-changed', {tab: tab.value, tabsetId: tabsetId.value})
    }
  }
}

const update = (ident: string, val: string) => {
  if (tab.value) {
    tab.value.description = val
  }
}
</script>
