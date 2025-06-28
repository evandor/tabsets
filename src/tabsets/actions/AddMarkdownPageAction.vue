<template>
  <template v-if="props.level === 'root'">
    <template v-if="props.element === 'contextmenu'">
      <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="o_tab" color="primary" label="Add Markdown Page" />
    </template>
    <template v-else>
      <fab-like-btn @button-clicked="clicked()" :color="'warning'" :icon="'add'" />
    </template>
  </template>
</template>
<script setup lang="ts">
import { uid, useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import FabLikeBtn from 'src/tabsets/actions/widgets/FabLikeBtn.vue'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { LoadDynamicTabsCommand } from 'src/tabsets/commands/LoadDynamicTabsCommand'
import { Tab } from 'src/tabsets/models/Tab'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const clicked = () => {
  $q.dialog({
    title: 'Save Markdown File',
    message: "The file's content can be analysed and dynamically extracted.",
    options: {
      type: 'checkbox',
      model: [],
      items: [{ label: 'Use for links', value: 'useForLinks', color: 'secondary' }],
    },
    cancel: true,
    persistent: true,
  }).onOk((data: any) => {
    console.log('saving...', props.currentChromeTab?.id, data)
    try {
      const useForLinks = data['useForLinks' as keyof object] as boolean
      if (props.currentChromeTab) {
        const newTab = new Tab(uid(), props.currentChromeTab)
        useCommandExecutor()
          .execute(new AddTabToTabsetCommand(newTab, props.tabset, props.tabset.folderActive))
          .then(() => {
            if (useForLinks) {
              useCommandExecutor().execute(new LoadDynamicTabsCommand(props.tabset, newTab.url!))
            }
          })
      }
      //      return Promise.resolve(new ExecutionResult('', 'done'))
    } catch (error: any) {
      console.warn('error', error)
      //    return Promise.reject('error creating markdown tab')
    }
  })
}
</script>
