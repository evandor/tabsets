<template>
  <q-separator inset />
  <ContextMenuItem
    v-close-popup
    @was-clicked="clicked()"
    icon="sym_o_new_window"
    color="primary"
    :label="props.tabset.newTabSource ? 'Update NewTab Page' : 'Use in NewTab Page'" />
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { NEW_TAB_EXTENSION_ID } from 'src/boot/constants'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import OpenNewTabDialog from 'src/tabsets/dialogues/OpenNewTabDialog.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const clicked = () => {
  $q.dialog({
    component: OpenNewTabDialog,
    componentProps: {
      tabset: props.tabset,
    },
  }).onOk(() => {
    // TODO make command
    const tabset = new Tabset(props.tabset.id, props.tabset.name, props.tabset.tabs, [], props.tabset.spaces)
    chrome.runtime.sendMessage(NEW_TAB_EXTENSION_ID, { message: 'setTabset', tabset: tabset }, function (response) {
      console.log('sent to newtab extension and got', response)
      if (response.message === 'done') {
        console.log('marking tabset with newtab flag')
        props.tabset.newTabSource = true
        useTabsetsStore().saveTabset(props.tabset)
      }
    })
  })
}
</script>
