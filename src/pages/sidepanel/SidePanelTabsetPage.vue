<template>
  <div class="row q-ma-none q-pa-none"
       @mouseover="showTabsetPageEdit = true"
       @mouseleave="showTabsetPageEdit = false"
       style="border-top:1px dotted grey">
     <!--   <div class="col-12">{{ props.tabsetPage }}</div>-->
    <div class="col-11">
      <q-scroll-area style="height: 100%; width:100%;max-height:200px"
                     :style="scrollAreaMinHeight"
                     :thumb-style="thumbStyle as unknown as Partial<CSSStyleDeclaration>"
                     :bar-style="barStyle as unknown as Partial<CSSStyleDeclaration>">
        <div class="editorx_body">
          <div :id="'editorjs_' + tabsetId"/>
        </div>
      </q-scroll-area>


    </div>
    <div class="col bg-white text-right">
      <q-icon v-if="showTabsetPageEdit"
              class="cursor-pointer q-mr-xs q-mt-xs" name="edit" color="primary" @click="openTabsetPage()" size="12px"/>
    </div>
  </div>

</template>

<script lang="ts" setup>

import {onMounted, PropType, ref, watchEffect} from "vue";
import EditorJS, {OutputData} from "@editorjs/editorjs";
import EditorJsConfig from "src/utils/EditorJsConfig";
import {openURL} from "quasar";

const props = defineProps({
  tabsetId: {type: String, required: true},
  tabsetPage: {type: Object, required: true}
})

const showTabsetPageEdit = ref(false)
const scrollAreaMinHeight = ref("min-height:20px")

const thumbStyle = {
  right: '4px',
  borderRadius: '5px',
  backgroundColor: '#027be3',
  width: '5px',
  opacity: 0.75
}

const barStyle = {
  right: '2px',
  borderRadius: '9px',
  backgroundColor: '#027be3',
  width: '9px',
  opacity: 0.2
}

let editorJS2: EditorJS = undefined as unknown as EditorJS

onMounted(() => {
  if (!editorJS2) {
    // @ts-ignore
    editorJS2 = new EditorJS({
      holder: "editorjs_" + props.tabsetId,
      autofocus: true,
      readOnly: false,
      minHeight: 1,
      data: (props.tabsetPage || {}) as OutputData,
      tools: EditorJsConfig.toolsconfig
    });
    // if the editor is readonly from the start, I cannot update it when tabset.page changes
    setTimeout(() => {
      editorJS2.readOnly.toggle(true)
    }, 1000)
  }
})

watchEffect(async () => {
  console.log("updating", props.tabsetPage !== undefined) // log seems necessary here !?!
  if (editorJS2) {
    await editorJS2.readOnly.toggle(false)
    await editorJS2.blocks.clear()
    await editorJS2.blocks.render((props.tabsetPage || {}) as OutputData)
    await editorJS2.readOnly.toggle(true)
  }
})

watchEffect(() => {
  const blocksCount = props.tabsetPage ? props.tabsetPage['blocks' as keyof object].length : 0
  let minHeight = Math.min(20 + blocksCount * 30, 110)
  scrollAreaMinHeight.value = `min-height:${minHeight}px`
})

const openTabsetPage = () => openURL(chrome.runtime.getURL("/www/index.html#/tabsets/" + props.tabsetId + "?tab=page"))

</script>

<style>
.editorx_body {
  max-width: 1000px;
  margin: 0px auto;
  box-sizing: border-box;
  border: 0 solid #eee;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 6px 18px #e8edfa80;
}

.ce-block__content,
.ce-toolbar__content {
  max-width: none;
}

.ce-paragraph {
  font-size: 12px;
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
  max-width: calc(100% - 50px);
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
