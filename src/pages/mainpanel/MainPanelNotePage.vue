<template>
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10" v-if="editMode">
            <q-input type="text" class="text-h6" v-model="title" placeholder="title..." autofocus/>
          </div>
          <div class="col-10 text-h6" v-else>
            {{ tab?.title }}
          </div>
          <div class="col" v-if="!editMode" @click="editMode = true">
            Edit
          </div>
          <div class="col" v-else>

          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div>
    <div class="q-ma-lg" v-if="!editMode" v-html="editor">
    </div>
    <q-editor v-else
              flat
              v-model="editor"
              ref="editorRef"
              min-height="15rem"
              toolbar-text-color="white"
              toolbar-toggle-color="yellow-8"
              toolbar-bg="primary"
              placeholder="start typing..."
              :definitions="{
        save: {
          tip: 'Save your work',
          icon: 'save',
          label: 'Save',
          handler: saveWork
        }
      }"
              :toolbar="toolbar()">

      <template v-slot:tabs>
        <q-btn-dropdown
          dense no-caps
          ref="tokenRef"
          no-wrap
          unelevated
          color="white"
          text-color="primary"
          label="Tabs"
          size="sm"
        >
          <q-list dense>
            <q-item v-for="tab in tabsStore.getCurrentTabset.tabs"
                    tag="label" clickable @click="add(tab)">
              <!--              <q-item-section side>-->
              <!--                <q-icon name="tab"/>-->
              <!--              </q-item-section>-->
              <q-item-section>{{ tab.title }} - {{ tab.url }}*</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
    </q-editor>
  </div>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute, useRouter} from "vue-router";
import {date, uid, useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab, UrlExtension} from "src/models/Tab";
import {useUtils} from "src/services/Utils";
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset} from "src/models/Tabset";
import ChromeApi from "src/services/ChromeApi";
import {useSettingsStore} from "stores/settingsStore";

const {formatDate, sendMsg, sanitize} = useUtils()

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

const noteId = ref<string | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetId = ref<string | undefined>(route.query.tsId as string)
const editMode = ref(false)
const title = ref('')

const markdown = ref('')
const plugins = ref([])
const count = ref(0)

const editor = ref<any>(tabsStore.getCurrentTabset?.page || '')
const editorRef = ref<any>(null)
const tokenRef = ref(null)


watchEffect(async () => {
  noteId.value = route.params.noteId as unknown as string
  console.log("route.params.edit", route.query.edit)
  editMode.value = route.query.edit ? route.query.edit === "true" : false
  console.log("watched...", noteId.value)
  const tabObject = await useTabsStore().getTab(noteId.value)
  if (tabObject) {
    console.log("tabObject", tabObject)
    tab.value = tabObject['tab' as keyof object] as unknown as Tab
    editor.value = tab.value?.longDescription || ''
    tabsetId.value = tabObject['tabsetId' as keyof object]
    title.value = tab.value.title || ''
  }
})

const toolbar = () => {
  const defaults = [
    ['tabs'],
    ['bold', 'italic', 'underline'],
    [{
      label: $q.lang.editor.formatting,
      icon: $q.iconSet.editor.formatting,
      list: 'no-icons',
      options: ['p', 'h3', 'h4', 'h5', 'h6', 'code']
    }],
    ['save']
  ]
  if (useSettingsStore().isEnabled('dev')) {
    defaults.push(['viewsource'])
  }
  return defaults
}

const update = (ident: string, val: string) => {
  if (tab.value && ident === 'description') {
    tab.value.description = val
  } else if (tab.value && ident === 'title') {
    tab.value.title = val
  }
}
const saveWork = () => {

  console.log("saving", tabsetId.value)
  if (tabsetId.value) {
    const tabset = useTabsetService().getTabset(tabsetId.value) as Tabset | undefined
    console.log("tabset", tabset)
    if (tabset && tab.value) {
      //tab.value.description = description.value
      tab.value.title = sanitize(title.value)
      tab.value.longDescription = sanitize(editor.value)
      console.log("saving note", tabset, tabsetId.value, markdown.value)
      // needed to update the note in the side panel
      sendMsg('tab-changed', {tab: tab.value, tabsetId: tabsetId.value, noteId: noteId.value})
    } else if (tabset) { // new note
      const url = chrome.runtime.getURL('www/index.html') + "#" + route.fullPath
      const newTabId = uid()
      const newTab = new Tab(newTabId, ChromeApi.createChromeTabObject(sanitize(title.value), url, ""))
      newTab.tags.push("Note")
      newTab.extension = UrlExtension.NOTE
      newTab.longDescription = sanitize(editor.value)
      //   useTabsetService().saveCurrentTabset()
      newTab.url = newTab.url?.split('?')[0] + newTabId
      // needed to update the note in the side panel
      console.log("sending message", {tab: newTab, tabsetId: tabsetId.value})
      sendMsg('tab-changed', {tab: newTab, tabsetId: tabsetId.value})
      // redirect after save
      router.push("/mainpanel/notes/" + newTabId)
    }
  }


  // if (tabsStore.getCurrentTabset) {
  //   tabsStore.getCurrentTabset.page = sanitize(editor.value)
  //   useTabsetService().saveCurrentTabset()
  //   $q.notify({
  //     message: 'Saved your text to local storage',
  //     color: 'green-4',
  //     textColor: 'white',
  //     icon: 'cloud_done'
  //   })
  // }
}
const add = (tab: Tab) => {
  const edit = editorRef.value
  if (edit) {
    // @ts-ignore
    tokenRef.value.hide()
    edit.caret.restore()
    edit.runCmd('insertHTML', `&nbsp;<div class="editor_token row inline items-center" contenteditable="false">&nbsp;
        <img src="${tab.favIconUrl}" height="24px" width="24px">&nbsp;<span>${tab.title}</span></div>&nbsp;`)
    edit.focus()
  }
}
</script>
