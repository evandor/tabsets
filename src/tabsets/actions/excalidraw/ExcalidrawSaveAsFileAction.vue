<template>
  <template v-if="props.element === 'contextmenu'">
    <ContextMenuItem
      v-close-popup
      @was-clicked="clicked()"
      icon="o_tab"
      color="primary"
      :disable="props.tabset.sharing?.sharedId !== undefined"
      label="Save as new file">
    </ContextMenuItem>
  </template>
  <template v-else>
    <fab-like-btn @button-clicked="clicked()" color="warning" icon="img:https://excalidraw.com/favicon-32x32.png" />
    <q-tooltip class="tooltip-small">Add Excalidraw File</q-tooltip>
    <!--    <q-tooltip class="tooltip-small" v-else-if="containedInTsCount > 0">-->
    <!--      {{ tooltipAlreadyInOtherTabsets(props.tabset!.name) }}-->
    <!--    </q-tooltip>-->
    <!--    <q-tooltip class="tooltip-small" v-else>-->
    <!--      Add current Tab to '{{ tabsetNameOrChain(props.tabset as Tabset) }}'...-->
    <!--    </q-tooltip>-->
  </template>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ExcalidrawAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ExcalidrawAddUrlToTabsetHandler'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import FabLikeBtn from 'src/tabsets/actions/widgets/FabLikeBtn.vue'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { ref } from 'vue'

const $q = useQuasar()
const props = defineProps<ActionProps>()

const filename = ref('')

const clicked = () => {
  $q.dialog({
    title: 'Save as Excalidraw File',
    message: 'Please Provide a name (min 3 characters)!',
    prompt: { model: filename.value, isValid: (val: string) => val.length > 2, type: 'text' },
    cancel: true,
    persistent: true,
  }).onOk((filename: string) => {
    const ts = useTabsetsStore().getCurrentTabset
    const chromeTab = useTabsStore2().currentChromeTab
    if (ts && chromeTab) {
      const folder = useTabsetsStore().getActiveFolder(ts)
      console.log('saving new excalidraw file', filename, ts, chromeTab)
      new ExcalidrawAddUrlToTabsetHandler($q).clicked(chromeTab, ts, folder, { data: { filename } })
    }
  })
}
</script>
