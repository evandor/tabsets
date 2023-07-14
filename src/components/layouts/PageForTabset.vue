<template>

  <div class="q-pa-none q-ma-none" style="width:100%">
    <q-editor
      v-model="editor"
      ref="editorRef"
      min-height="15rem"
      toolbar-text-color="white"
      toolbar-toggle-color="yellow-8"
      toolbar-bg="primary"
      :definitions="{
        save: {
          tip: 'Save your work',
          icon: 'save',
          label: 'Save',
          handler: saveWork
        }
      }"
      :toolbar="[
        ['tabs'],
        ['bold', 'italic', 'underline'],
        [{
          label: $q.lang.editor.formatting,
          icon: $q.iconSet.editor.formatting,
          list: 'no-icons',
          options: ['p', 'h3', 'h4', 'h5', 'h6', 'code']
        }],
        ['save']
      ]"
    >
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
              <q-item-section>{{tab.chromeTab.title}} - {{ tab.chromeTab.url }}*</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
    </q-editor>

<!--    <q-card flat bordered>-->
<!--      <q-card-section>-->
<!--        <pre style="white-space: pre-line">{{ editor }}</pre>-->
<!--      </q-card-section>-->
<!--    </q-card>-->

<!--    <q-card flat bordered>-->
<!--      <q-card-section v-html="editor"/>-->
<!--    </q-card>-->
  </div>

</template>

<script setup lang="ts">
import {Tab} from "src/models/Tab";
import {ref, watchEffect} from "vue";
import {useQuasar} from "quasar";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useRoute} from "vue-router";
import {useTabsetService} from "src/services/TabsetService2";
import sanitizeHtml from 'sanitize-html';
import {useUtils} from "src/services/Utils";

const {sanitize} = useUtils()

const $q = useQuasar()
const tabsStore = useTabsStore()
const route = useRoute()

const thumbnails = ref<Map<string, string>>(new Map())

const tabsetId = ref(null as unknown as string)
const editor = ref<any>(tabsStore.getCurrentTabset?.page || '')
const editorRef = ref<any>(null)
const tokenRef = ref(null)

watchEffect(() => {
  tabsetId.value = route.params.tabsetId as string
  if (tabsetId.value) {
    console.debug("got tabset id", tabsetId.value)
    tabsStore.selectCurrentTabset(tabsetId.value)
  }
})

function unpinnedNoGroup() {
  return _.filter(
    _.map(tabsStore.getCurrentTabs, t => t),
    // @ts-ignore
    (t: Tab) => !t?.chromeTab.pinned && t?.chromeTab.groupId === -1)
}

function tabsForGroup(groupId: number): Tab[] {
  return _.filter(tabsStore.getTabset(tabsetId.value)?.tabs,
    //@ts-ignore
    (t: Tab) => t?.chromeTab.groupId === groupId)
}

const pasteCapture = (e: any) => console.log("pasteCapture", e)
const dropCapture = (e: any) => console.log("dropCapture", e)
const add = (tab: Tab) => {
  const edit = editorRef.value
  if (edit) {
    // @ts-ignore
    tokenRef.value.hide()
    edit.caret.restore()
    edit.runCmd('insertHTML', `&nbsp;<div class="editor_token row inline items-center" contenteditable="false">&nbsp;
        <img src="${tab.chromeTab.favIconUrl}" height="24px" width="24px">&nbsp;<span>${tab.chromeTab.title}</span></div>&nbsp;`)
    edit.focus()
  }
}
const saveWork = () => {
  if (tabsStore.getCurrentTabset) {
    tabsStore.getCurrentTabset.page = sanitize(editor.value)
    useTabsetService().saveCurrentTabset()
    $q.notify({
      message: 'Saved your text to local storage',
      color: 'green-4',
      textColor: 'white',
      icon: 'cloud_done'
    })
  }
}

</script>

<style lang="sass" scoped>
</style>
