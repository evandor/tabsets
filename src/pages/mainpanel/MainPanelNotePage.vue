<template>
  <q-toolbar class="text-primary">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          <div class="col-10" v-if="editMode">
            <q-input type="text" class="text-h6" v-model="title" placeholder="title..." autofocus/>
          </div>
          <div class="col-10 text-h6" v-else>
            {{ tab?.title }}
          </div>
          <div class="col cursor-pointer" v-if="!editMode" @click="openInEditMode()">
            Edit
          </div>
          <div class="col cursor-pointer" v-else @click="saveWork()">
            Save
          </div>
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <!-- https://medium.com/code4mk-org/editorjs-vue-a78110c3fff8 -->
  <div class="editorx_body">
    <div class id="editorjs"/>
  </div>

</template>

<script lang="ts" setup>

import {onMounted, ref, watchEffect} from "vue";
import {useRoute, useRouter} from "vue-router";
import {uid, useQuasar} from "quasar";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab, UrlExtension} from "src/models/Tab";
import {useUtils} from "src/services/Utils";
import {useTabsetService} from "src/services/TabsetService2";
import {Tabset} from "src/models/Tabset";
import ChromeApi from "src/services/ChromeApi";
import EditorJS, {OutputData} from "@editorjs/editorjs";
// @ts-ignore
import Header from "@editorjs/header";
import Analytics from "src/utils/google-analytics";

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
const plugins = ref([])
const count = ref(0)
const editor = ref<any>(tabsStore.getCurrentTabset?.page || '')
const value = ref(null)

let editorJS2: EditorJS = undefined as unknown as EditorJS

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelNotePage', document.location.href);
})

watchEffect(async () => {
  noteId.value = route.params.noteId as unknown as string
  editMode.value = route.query.edit ? route.query.edit === "true" : false

  if (noteId.value) {
    useTabsStore().getTab(noteId.value)
        .then((tabObject: object | undefined) => {

          if (tabObject) {
            console.log("got tabobject1")
            tab.value = tabObject['tab' as keyof object] as unknown as Tab
            tabsetId.value = tabObject['tabsetId' as keyof object]
            if (!editorJS2) {
              // @ts-ignore
              editorJS2 = new EditorJS({
                holder: "editorjs",
                readOnly: !editMode.value,
                data: (tab.value.longDescription || {}) as OutputData,
                tools: {
                  header: {
                    class: Header,
                    shortcut: "CMD+SHIFT+H"
                  }
                }
              });
            } else {
              editorJS2.readOnly.toggle(!editMode.value)
            }
          }
        })
  } else {
    console.log("new Note")

    if (!editorJS2) { // && !editorJS2.isReady) {
      // @ts-ignore
      editorJS2 = new EditorJS({
        holder: "editorjs",
        autofocus: true,
        readOnly: false,
        data: {} as OutputData
      });
    }
  }

})

// watchEffect(async () => {
//   noteId.value = route.params.noteId as unknown as string
//   console.log("route.params.edit", route.query.edit)
//   editMode.value = route.query.edit ? route.query.edit === "true" : false
//   console.log("watched...", noteId.value)
//   const tabObject = await useTabsStore().getTab(noteId.value)
//   if (tabObject) {
//     console.log("tabObject", tabObject)
//     tab.value = tabObject['tab' as keyof object] as unknown as Tab
//     editor.value = tab.value?.longDescription || ''
//     tabsetId.value = tabObject['tabsetId' as keyof object]
//     title.value = tab.value.title || ''
//
//     editorJS.value = new EditorJS({
//       holder: 'editorjs',
//       autofocus: true,
//       initialBlock: "paragraph",
//       readOnly: true,
//       data: (tab.value?.longDescription || {}) as OutputData,
//       tools: {
//         header: {
//           class: Header,
//           shortcut: "CMD+SHIFT+H"
//         }
//       }
//     });
//   } else {
//
//   }
// })

const update = (ident: string, val: string) => {
  if (tab.value && ident === 'description') {
    tab.value.description = val
  } else if (tab.value && ident === 'title') {
    tab.value.title = val
  }
}
const saveWork = () => {

  console.log("saving", tabsetId.value)

  editorJS2.save().then((outputData: any) => {

    if (tabsetId.value) {
      const tabset = useTabsetService().getTabset(tabsetId.value) as Tabset | undefined
      console.log("tabset", tabset, tab.value)
      if (tabset && tab.value) {
        //tab.value.description = description.value
        tab.value.title = sanitize(title.value)
        tab.value.longDescription = outputData //sanitize(outputData)
        console.log("saving note", tabset, tabsetId.value)
        // needed to update the note in the side panel
        sendMsg('tab-changed', {tab: tab.value, tabsetId: tabsetId.value, noteId: noteId.value})
      } else if (tabset) { // new note
        const url = chrome.runtime.getURL('www/index.html') + "#" + route.fullPath
        const newTabId = uid()
        const newTab = new Tab(newTabId, ChromeApi.createChromeTabObject(sanitize(title.value), url, ""))
        newTab.tags.push("Note")
        newTab.extension = UrlExtension.NOTE
        newTab.longDescription = outputData
        //   useTabsetService().saveCurrentTabset()
        newTab.url = newTab.url?.split('?')[0] + newTabId
        // needed to update the note in the side panel
        console.log("sending message", {tab: newTab, tabsetId: tabsetId.value})
        sendMsg('tab-changed', {tab: newTab, tabsetId: tabsetId.value})
        // redirect after save
        router.push("/mainpanel/notes/" + newTabId)
      }
    } else {
      console.warn("tabset id missing")
    }
  }).catch((error: any) => {
    console.log('Saving failed: ', error)
  });

}

const openInEditMode = () => router.push('./' + tab.value?.id + '?edit=true&tsId=' + tabsetId.value)
</script>

<style scoped>
.editorx_body {
  width: 80%;
  height: 200px;
  margin-left: 10%;
  box-sizing: border-box;
}

.ce-block--focused {
  background: linear-gradient(
      90deg,
      rgba(2, 0, 36, 1) 0%,
      rgba(9, 9, 121, 0.5438550420168067) 35%,
      rgba(0, 212, 255, 1) 100%
  );
}
</style>
