<template>
  <!-- SpecialUrlAddToTabsetComponent -->
  <!--  {{ handler.actions(currentTabsetId, { tabset: props.tabset, level: props.level }) }}-->
  <template
    v-if="handler.actions(currentTabsetId, { tabset: props.tabset, level: props.level }).length == 0 && defaultAction">
    <q-btn
      @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, defaultAction))"
      class="q-ma-none q-px-sm q-py-none"
      :icon="defaultAction.icon"
      :class="{ shakeWithColor: animateAddtabButton, 'cursor-pointer': !alreadyInTabset }"
      :color="alreadyInTabset ? 'grey-5' : containedInTsCount > 0 ? 'primary' : 'secondary'"
      :size="props.level === 'root' ? 'sm' : 'xs'"
      data-testid="saveInTabsetBtn">
      <!--      <div>{{ defaultAction.label }}</div>-->
      <!--                  <q-icon right class="q-ma-none q-pa-none" size="2em" name="o_south" />-->
    </q-btn>
    <q-tooltip class="tooltip-small" v-if="alreadyInTabset">
      Tab is already contained in tabset '{{ props.tabset?.name }}'...
    </q-tooltip>
    <q-tooltip class="tooltip-small" v-else-if="containedInTsCount > 0">
      {{ tooltipAlreadyInOtherTabsets(props.tabset!.name) }}
    </q-tooltip>
    <q-tooltip class="tooltip-small" v-else>
      Add current Tab to '{{ tabsetNameOrChain(props.tabset as Tabset) }}'...
    </q-tooltip>
  </template>

  <!-- SpecialUrlAddToTabsetComponent handlerDefaultAction -->
  <template
    v-else-if="
      handler.actions(currentTabsetId, { tabset: props.tabset, level: props.level }).length > 0 && defaultAction
    ">
    <!-- :disable="!handler.actions()[0]!.active(props.currentChromeTab)"-->
    <q-btn-dropdown
      style="border-radius: 5px"
      :class="{ shakeWithColor: animateAddtabButton, 'cursor-pointer': !alreadyInTabset }"
      :color="defaultAction!.colorFkt()"
      data-testid="saveInTabsetBtn"
      v-close-popup
      @click.stop="
        emits(
          'buttonClicked',
          new ActionHandlerButtonClickedHolder(handler, defaultAction, {
            filename: defaultAction.label,
          }),
        )
      "
      class="q-ma-none q-px-none q-py-none"
      :size="props.level === 'root' ? 'sm' : 'xs'"
      :dense="defaultAction!.label.length > 15"
      split
      outline>
      <template v-slot:label>
        <span :style="defaultAction!.styleFkt(props.currentChromeTab, props.folder)">{{ defaultAction!.label }}</span>
      </template>
      <q-list dense style="min-width: 200px">
        <template v-for="l in handler.actions(currentTabsetId, { tabset: props.tabset, level: props.level })">
          <template v-if="'context' in l">
            <component
              :key="l.component.name"
              :is="l.component"
              :tabset="props.tabset"
              :folder="props.folder"
              :currentChromeTab="props.currentChromeTab"
              :level="props.level"
              :context="'context' in l ? l.context : {}" />
          </template>
          <template v-else>
            <component :key="l.name" :is="l" :tabset="props.tabset" :folder="props.folder" :level="props.level" />
          </template>
        </template>
      </q-list>
    </q-btn-dropdown>
    <q-tooltip
      class="tooltip-small"
      :delay="1000"
      v-if="!alreadyInTabset && containedInTsCount > 0"
      anchor="center left"
      self="center right"
      :offset="[10, 10]">
      click the dropdown icon for more options... A green button indicates the current tab already exists in another
      tabset
    </q-tooltip>
  </template>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { AddUrlToTabsetHandler } from 'src/tabsets/actionHandling/AddUrlToTabsetHandler'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { ActionContext } from 'src/tabsets/actionHandling/model/ActionContext'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'
import { Tabset } from '../models/Tabset'

const props = defineProps<{
  currentChromeTab: chrome.tabs.Tab
  tabset: Tabset
  folder?: Tabset
  level: 'root' | 'folder'
}>()

const emits = defineEmits(['buttonClicked', 'asNewFile'])

const $q = useQuasar()

const { getHandler } = useActionHandlers($q)

const handler = ref<AddUrlToTabsetHandler>(new NoopAddUrlToTabsetHandler())
const defaultAction = ref<ActionContext | undefined>(undefined)
const containedInTsCount = ref(0)
const animateAddtabButton = ref(false)
const currentTabsetId = ref<string | undefined>(undefined)
const alreadyInTabset = ref(false)

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (currentTabsetId.value = tsId))
})

watchEffect(() => {
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
  defaultAction.value = handler.value.defaultAction()
  console.log('***') //, handler.value.actions('currentTabsetId'))
  // const currentTabsetId = await useTabsetsStore().getCurrentTabsetId()
})

watchEffect(() => {
  containedInTsCount.value = useTabsetService().tabsetsFor(props.currentChromeTab.url!).length
})

watchEffect(() => {
  animateAddtabButton.value = useUiStore().animateAddtabButton
})

watchEffect(() => {
  alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(props.currentChromeTab.url)
})

const activeFolderNameFor = (ts: Tabset, activeFolder: string) => {
  const folder = useTabsetsStore().getActiveFolder(ts, activeFolder)
  return folder ? folder.name : ts.name
}

const tabsetNameOrChain = (tabset: Tabset) => {
  return tabset.folderActive ? activeFolderNameFor(tabset, tabset.folderActive) : tabset.name
}

const tooltipAlreadyInOtherTabsets = (tabsetName: string) =>
  `The current Tab is already contained in ${containedInTsCount.value} other tabsets. Click to add to ${tabsetName} as well.`
</script>
