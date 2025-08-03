<template>
  <template v-if="props.element === 'contextmenu'">
    <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="sym_o_add_circle" color="primary" :label="label" />
  </template>
  <template v-else>
    <fab-like-btn
      :disabled="props.disable"
      @button-clicked="clicked()"
      :color="alreadyInTabset ? 'grey-5' : containedInTsCount > 0 ? 'primary' : 'warning'"
      :class="{ shakeWithColor: animateAddtabButton, 'cursor-pointer': !alreadyInTabset }"
      :icon="'add'" />
    <q-tooltip class="tooltip-small" v-if="alreadyInTabset">Already in current tabset</q-tooltip>
    <q-tooltip class="tooltip-small" v-else-if="containedInTsCount > 0">
      {{ tooltipAlreadyInOtherTabsets(props.tabset!.name) }}
    </q-tooltip>
    <q-tooltip class="tooltip-small" v-else>
      Add current Tab to '{{ tabsetNameOrChain(props.tabset as Tabset) }}'...
    </q-tooltip>
  </template>
</template>
<script setup lang="ts">
import { uid } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import FabLikeBtn from 'src/tabsets/actions/widgets/FabLikeBtn.vue'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetType } from 'src/tabsets/models/Tabset'
import { ContentClassification } from 'src/tabsets/models/types/ContentClassification'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTagsService } from 'src/tags/TagsService'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'

const props = defineProps<ActionProps>()

const { handleError } = useNotificationHandler()

const label = ref('Add Tab')
const containedInTsCount = ref(0)
const alreadyInTabset = ref(false)
const animateAddtabButton = ref(false)

const clicked = async () => {
  console.log('clicked!!', props.currentChromeTab)

  async function tabInTabset(name: string, classification: ContentClassification, newTab: Tab) {
    let tabset = useTabsetsStore().getTabset(name)
    console.log('found tabset for id', name, tabset)
    if (!tabset) {
      tabset = await useTabsetsStore().createTabset(name, [], undefined, undefined, false, name)
      tabset.type = TabsetType.SPECIAL
      tabset.contentClassification = classification
      await useTabsetsStore().saveTabset(tabset)
    }
    return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, tabset))
  }

  if (props.currentChromeTab) {
    const newTab: Tab = new Tab(uid(), props.currentChromeTab)
    const tabCategory = useTagsService().getCurrentTabCategory()
    console.log('found category', tabCategory)
    switch (tabCategory) {
      case 'recipe':
        return await tabInTabset('recipes', 'recipe', newTab)
      case 'news':
        return await tabInTabset('news', 'news', newTab)
      case 'shopping':
        return await tabInTabset('shopping', 'shopping', newTab)
      default:
        // noop
        break
    }
    return useCommandExecutor().execute(new AddTabToTabsetCommand(newTab, props.tabset, props.folder?.id))
  }
  handleError('current browser tab not set!')
}

watchEffect(() => {
  if (props.currentChromeTab?.url) {
    alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(props.currentChromeTab.url)
    containedInTsCount.value = useTabsetService().tabsetsFor(props.currentChromeTab.url).length
  }
})

watchEffect(() => {
  animateAddtabButton.value = useUiStore().animateAddtabButton
})

const activeFolderNameFor = (ts: Tabset, activeFolder: string) => {
  const folder = useTabsetsStore().getActiveFolder(ts, activeFolder)
  return folder ? folder.name : ts.name
}

const tabsetNameOrChain = (tabset: Tabset) => {
  return tabset.folderActive ? activeFolderNameFor(tabset, tabset.folderActive) : tabset.name
}

const tooltipAlreadyInOtherTabsets = (tabsetName: string) =>
  `Already contained in ${containedInTsCount.value} other tabsets. Click to add here as well.`
</script>
