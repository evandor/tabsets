<template>

  <div class="row">
    <div class="col text-right">
      <div v-if="editMode" class="cursor-pointer" @click="saveWork()">
        Save
        <q-icon name="save" size="24px" color="warning"/>
      </div>
      <div v-else class="cursor-pointer" @click="openInEditMode()">
        Edit
        <q-icon name="edit" size="24px"/>
      </div>
    </div>
  </div>

  <!-- https://medium.com/code4mk-org/editorjs-vue-a78110c3fff8 -->
  <div class="q-mx-xl q-px-md">
    <div class="editorx_body">
      <div v-if="editMode">
        <q-input type="text" class="text-h6" borderless v-model="title" placeholder="title..." autofocus/>
      </div>
      <div class="text-h6" v-else>
        {{ tab?.title }}
      </div>
      <div id="editorjs" ref="editorJsRef"/>
    </div>
  </div>

</template>

<script lang="ts" setup>

import 'regenerator-runtime/runtime'
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
//import 'regenerator-runtime/runtime'
// @ts-ignore
import Header from "@editorjs/header";
// @ts-ignore
import LinkTool from "@editorjs/link";
// @ts-ignore
import Quote from "@editorjs/quote";
// @ts-ignore
import ImageTool from "@editorjs/image";
// @ts-ignore
import Table from "@editorjs/table";
// @ts-ignore
import editorjsColumns from "@calumk/editorjs-columns";
import Analytics from "src/utils/google-analytics";
import {LinkTool2} from "src/pages/mainpanel/editorjs/linkTool"

import './editorjs/linkTool.css';

const {formatDate, sendMsg, sanitize} = useUtils()

const route = useRoute()
const router = useRouter()

const noteId = ref<string | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetId = ref<string | undefined>(route.query.tsId as string)
const editMode = ref(false)
const title = ref('')
const editorJsRef = ref(null)

let editorJS2: EditorJS = undefined as unknown as EditorJS

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelNotePage', document.location.href);
})

const column_tools = {
  header: Header,
  linkTool2: {
    class: LinkTool2,
    config: {
      endpoint: `/www/editor.html`, // Your backend endpoint for url data fetching,
    }
  }
  //alert : Alert,
  //paragraph : editorjsParagraphLinebreakable,
  //delimiter : Delimiter
}

const toolsconfig = {
  header: {
    class: Header,
    shortcut: "CMD+SHIFT+H"
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    shortcut: 'CMD+SHIFT+O',
    config: {
      quotePlaceholder: 'Enter a quote',
      captionPlaceholder: 'Quote\'s author',
    }
  },
  linkTool2: {
    class: LinkTool2,
    config: {
      endpoint: `/www/editor.html`, // Your backend endpoint for url data fetching,
    }
  },
  table: {
    class: Table,
    inlineToolbar: true,
    config: {
      rows: 2,
      cols: 3,
    },
  },
  columns: {
    class: editorjsColumns,
    config: {
      EditorJsLibrary: EditorJS,
      tools: column_tools
    }
  },
  image: {
    class: ImageTool,
    config: {
      /**
       * Custom uploader
       */
      uploader: {
        /**
         * Upload file to the server and return an uploaded image data
         * @param {File} file - file selected from the device or pasted by drag-n-drop
         * @return {Promise.<{success, file: {url}}>}
         */
        uploadByFile(file: any) {
          // your own uploading logic here

        },

        /**
         * Send URL-string to the server. Backend should load image by this URL and return an uploaded image data
         * @param {string} url - pasted image URL
         * @return {Promise.<{success, file: {url}}>}
         */
        uploadByUrl(url: string) {
          // your ajax request for uploading


        }
      }
    }
  }
}

watchEffect(async () => {
  noteId.value = route.params.noteId as unknown as string
  editMode.value = route.query.edit ? route.query.edit === "true" : false

  if (noteId.value) {
    useTabsStore().getTab(noteId.value)
        .then((tabObject: object | undefined) => {

          if (tabObject) {
            console.log("got tabobject1", tabObject)
            tab.value = tabObject['tab' as keyof object] as unknown as Tab
            tabsetId.value = tabObject['tabsetId' as keyof object]
            title.value = tabObject['tab' as keyof object]['title'] || 'unknown'
            if (!editorJS2) {
              // @ts-ignore
              editorJS2 = new EditorJS({
                holder: "editorjs",
                readOnly: !editMode.value,
                data: (tab.value.longDescription || {}) as OutputData,
                tools: toolsconfig
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
        data: {} as OutputData,
        tools: toolsconfig
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

<style>
.editorx_body {
  max-width: 1000px;
  margin: 0px auto;
  height: 200px;
  box-sizing: border-box;
  border: 0 solid #eee;
  border-radius: 5px;
  padding: 10px;
  /* box-shadow: 0 6px 18px #e8edfa80; */
}

.ce-block__content,
.ce-toolbar__content {
  max-width: none;
}

/* editorjsColumns */

.ce-editorjsColumns_col {
  border: 1px solid #eee;
  border-radius: 5px;
  gap: 10px;
  padding-top: 10px;
}

.ce-editorjsColumns_col:focus-within {
  box-shadow: 0 6px 18px #e8edfa80;
}

@media (max-width: 800px) {
  .ce-editorjsColumns_wrapper {
    flex-direction: column;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
}

.ce-inline-toolbar {
  z-index: 1000
}

.ce-block__content,
.ce-toolbar__content {
  max-width: calc(100% - 50px); /* example value, adjust for your own use case */
}

/*   */
.ce-toolbar__actions {
  right: calc(100% + 30px);
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
}

/* Would be better to remove --narrow mode */
/* Issue Raised */
/* // This causes an error which is good i think? */
.codex-editor--narrow .codex-editor__redactor {
  margin: 0;
}

/* Required to prevent clipping */
.ce-toolbar {
  z-index: 4;
}

.codex-editor {
  /* background:#f00 !important; */
  z-index: auto !important;
}


</style>
