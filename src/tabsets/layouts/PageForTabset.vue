<template>
  <div class="q-mx-xl q-px-md">
    <div class="editorx_body">
      <div id="editorjs" ref="editorJsRef" @keyup="(v) => keyUpEvent()" />
    </div>
  </div>
</template>

<script setup lang="ts">
// without this, getting "EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed"
import 'regenerator-runtime/runtime'
import { useUtils } from 'src/core/services/Utils'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const { sendMsg } = useUtils()

const route = useRoute()

const tab = ref<Tab | undefined>(undefined)
const tabsetId = ref<string | undefined>(route.query.tsId as string)
const tabset = ref<Tabset | undefined>(undefined)
const dirty = ref(false)

let savingInterval: NodeJS.Timeout | undefined = undefined

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  if (tabsetId.value) {
    console.debug('got tabset id', tabsetId.value)
    tabset.value = useTabsetsStore().getTabset(tabsetId.value)
    useTabsetsStore().selectCurrentTabset(tabsetId.value)

    // if (tabset.value && !editorJS2) {
    //   // && !editorJS2.isReady) {
    //   editorJS2 = new EditorJS({
    //     holder: 'editorjs',
    //     autofocus: true,
    //     readOnly: false,
    //     data: (tabset.value.page || {}) as OutputData,
    //     // @ts-expect-error xxx
    //     tools: EditorJsConfig.toolsconfig,
    //   })
    // }
  }
})

const keyUpEvent = () => {
  if (!dirty.value) {
    console.log('setting dirty, starting save interval')
    savingInterval = setInterval(() => {
      saveWork()
    }, 2000)
  }
  dirty.value = true
}

const saveWork = () => {
  console.log('saving', tabsetId.value)
}
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

.ce-paragraph {
  font-size: 16px;
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
  z-index: 1000;
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
