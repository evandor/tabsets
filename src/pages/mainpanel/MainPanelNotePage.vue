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

    <div class="col-2 text-subtitle1">
      Title
    </div>
    <div class="col-10" v-if="!editMode">
      {{ title }}
    </div>
    <div class="col-10 bg-grey-1" v-else>
      <q-input type="text" v-model="title"/>
    </div>
  </div>

  <div class="row q-ma-none q-ma-lg">
    <div class="col-2 text-subtitle1">
      Description
    </div>
    <div class="col-6" v-if="!editMode">
      {{ description }}
    </div>
    <div class="col-6 bg-grey-1" v-else>
      <q-input type="textarea" v-model="description"/>
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

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {date, uid} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab, UrlExtension} from "src/models/Tab";
import {useUtils} from "src/services/Utils";
import '@quasar/quasar-ui-qmarkdown/dist/index.css'
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset} from "src/models/Tabset";
import ChromeApi from "src/services/ChromeApi";

const {formatDate, sendMsg} = useUtils()

const route = useRoute()

const noteId = ref<string | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetId = ref<string | undefined>(route.query.tsId as string)
const editMode = ref(false)
const title = ref('')
const description = ref('')

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

watchEffect(async () => {
  noteId.value = route.params.noteId as unknown as string
  console.log("route.params.edit", route.query.edit)
  editMode.value = route.query.edit ? route.query.edit === "true" : false
  console.log("watched...", noteId.value)
  const tabObject = await useTabsStore().getTab(noteId.value)
  if (tabObject) {
    console.log("tabObject", tabObject)
    tab.value = tabObject['tab' as keyof object] as unknown as Tab
    markdown.value = tab.value?.longDescription || ''
    tabsetId.value = tabObject['tabsetId' as keyof object]
    title.value = tab.value.chromeTab.title || ''
    description.value = tab.value.description || ''
  }
})

const save = () => {
  console.log("saving", tabsetId.value)
  if (tabsetId.value) {
    const tabset = useTabsetService().getTabset(tabsetId.value) as Tabset | undefined
    console.log("tabset", tabset)
    if (tabset && tab.value) {
      tab.value.longDescription = markdown.value
      console.log("saving note", tabset, tabsetId.value, markdown.value)
      // needed to update the note in the side panel
      sendMsg('tab-changed', {tab: tab.value, tabsetId: tabsetId.value})
    } else if (tabset) { // new note
      const url = chrome.runtime.getURL('www/index.html') + "#" + route.fullPath
      const newTabId = uid()
      const newTab = new Tab(newTabId, ChromeApi.createChromeTabObject(title.value, url, ""))
      newTab.tags.push("Note")
      newTab.extension = UrlExtension.NOTE
      newTab.description = description.value
      //newTab.note = description.value
      newTab.chromeTab.url = newTab.chromeTab.url?.split('?')[0] + newTabId
      // needed to update the note in the side panel
      console.log("sending message", {tab: newTab, tabsetId: tabsetId.value})
      sendMsg('tab-changed', {tab: newTab, tabsetId: tabsetId.value})
    }
  }
}

const update = (ident: string, val: string) => {
  if (tab.value && ident === 'description') {
    tab.value.description = val
  } else if (tab.value && ident === 'title') {
    tab.value.chromeTab.title = val
  }
}
</script>
