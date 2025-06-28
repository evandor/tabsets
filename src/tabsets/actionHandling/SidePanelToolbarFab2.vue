<template>
  <!-- SidePanelToolbarFab2 -->
  <!-- -->
  <!--      @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder2(actions[0]!))"-->
  <template v-if="actions.length === 1">
    <component
      :key="actions[0]!.component.name"
      :is="actions[0]!.component"
      :tabset="props.tabset"
      :folder="props.folder"
      :currentChromeTab="props.currentChromeTab"
      :level="'root'"
      element="btn" />

    <!--    <q-btn-->
    <!--      padding="xs"-->
    <!--      fab-mini-->
    <!--      unelevated-->
    <!--      class="q-ma-none q-px-sm q-py-none"-->
    <!--      icon="add"-->
    <!--      :class="{ shakeWithColor: animateAddtabButton, 'cursor-pointer': !alreadyInTabset }"-->
    <!--      :color="alreadyInTabset ? 'grey-5' : containedInTsCount > 0 ? 'primary' : 'warning'"-->
    <!--      size="12px"-->
    <!--      @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder2(actions[0]!))"-->
    <!--      data-testid="saveInTabsetBtn">-->
    <!--      &lt;!&ndash;      <div>{{ defaultAction.label }}</div>&ndash;&gt;-->
    <!--      &lt;!&ndash;                  <q-icon right class="q-ma-none q-pa-none" size="2em" name="o_south" />&ndash;&gt;-->
    <!--    </q-btn>-->
    <template v-if="useSettingsStore().has('DEBUG_MODE')">
      <q-tooltip class="tooltip-small">Debug: single button fab {{ actions[0] }}</q-tooltip>
    </template>
    <!--    &lt;!&ndash;    <q-tooltip class="tooltip-small" v-if="alreadyInTabset">Already in current tabset</q-tooltip>&ndash;&gt;-->
    <!--    &lt;!&ndash;    <q-tooltip class="tooltip-small" v-else-if="containedInTsCount > 0">&ndash;&gt;-->
    <!--    &lt;!&ndash;      {{ tooltipAlreadyInOtherTabsets(props.tabset!.name) }}&ndash;&gt;-->
    <!--    &lt;!&ndash;    </q-tooltip>&ndash;&gt;-->
    <!--    &lt;!&ndash;    <q-tooltip class="tooltip-small" v-else>&ndash;&gt;-->
    <!--    &lt;!&ndash;      Add current Tab to '{{ tabsetNameOrChain(props.tabset as Tabset) }}'...&ndash;&gt;-->
    <!--    &lt;!&ndash;    </q-tooltip>&ndash;&gt;-->
  </template>
  <template v-else>
    <!--    <q-page-sticky position="bottom-right" :offset="[2, -30]">-->
    <!--    <q-fab icon="keyboard_arrow_down" direction="down" color="primary" padding="xs" vertical-actions-align="right">-->
    <!--      <template v-for="l in actions">-->
    <!--        <template v-if="'context' in l">-->
    <!--          <component-->
    <!--            :key="l.component.name"-->
    <!--            :is="l.component"-->
    <!--            :tabset="props.tabset"-->
    <!--            :folder="props.folder"-->
    <!--            :currentChromeTab="props.currentChromeTab"-->
    <!--            :level="'root'"-->
    <!--            element="fab"-->
    <!--            :context="'context' in l ? l.context : {}" />-->
    <!--        </template>-->
    <!--      </template>-->
    <!--    </q-fab>-->
    <q-btn
      padding="xs"
      fab-mini
      icon="keyboard_arrow_down"
      color="warning"
      unelevated
      size="12px"
      class="cursor-pointer q-ma-none q-pa-none">
      <q-tooltip class="tooltip-small" style="width: 130px" anchor="top left" :delay="800"
        >Click to show options</q-tooltip
      >
    </q-btn>

    <q-menu :offset="[0, 0]" transition-show="jump-down" transition-hide="jump-up">
      <q-list dense style="min-width: 150px">
        <template v-for="l in actions">
          <template v-if="'context' in l">
            <component
              :key="l.component.name"
              :is="l.component"
              :tabset="props.tabset"
              :folder="props.folder"
              :currentChromeTab="props.currentChromeTab"
              :level="'root'"
              element="contextmenu" />
          </template>
        </template>
      </q-list>
    </q-menu>
    <!--    </q-page-sticky>-->
  </template>

  <!--  <template-->
  <!--    v-if="-->
  <!--      handler.actions(currentTabsetId, {-->
  <!--        tabset: props.tabset,-->
  <!--        level: 'root',-->
  <!--        currentChromeTab: props.currentChromeTab,-->
  <!--        element: 'contextmenu',-->
  <!--      }).length == 0 && defaultAction-->
  <!--    ">-->
  <!--    <q-btn-->
  <!--      padding="xs"-->
  <!--      fab-mini-->
  <!--      unelevated-->
  <!--      @click.stop="emits('buttonClicked', new ActionHandlerButtonClickedHolder(handler, defaultAction))"-->
  <!--      class="q-ma-none q-px-sm q-py-none"-->
  <!--      :icon="defaultAction.icon"-->
  <!--      :class="{ shakeWithColor: animateAddtabButton, 'cursor-pointer': !alreadyInTabset }"-->
  <!--      :color="alreadyInTabset ? 'grey-5' : containedInTsCount > 0 ? 'primary' : 'warning'"-->
  <!--      size="12px"-->
  <!--      data-testid="saveInTabsetBtn">-->
  <!--      &lt;!&ndash;      <div>{{ defaultAction.label }}</div>&ndash;&gt;-->
  <!--      &lt;!&ndash;                  <q-icon right class="q-ma-none q-pa-none" size="2em" name="o_south" />&ndash;&gt;-->
  <!--    </q-btn>-->
  <!--    <q-tooltip class="tooltip-small" v-if="alreadyInTabset">Already in current tabset</q-tooltip>-->
  <!--    <q-tooltip class="tooltip-small" v-else-if="containedInTsCount > 0">-->
  <!--      {{ tooltipAlreadyInOtherTabsets(props.tabset!.name) }}-->
  <!--    </q-tooltip>-->
  <!--    <q-tooltip class="tooltip-small" v-else>-->
  <!--      Add current Tab to '{{ tabsetNameOrChain(props.tabset as Tabset) }}'...-->
  <!--    </q-tooltip>-->
  <!--  </template>-->
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { NoopAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/NoopAddUrlToTabsetHandler'
import { ComponentWithContext, TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, shallowRef, watchEffect } from 'vue'
import { Tabset } from '../models/Tabset'

const props = defineProps<{
  currentChromeTab: chrome.tabs.Tab
  tabset: Tabset
  folder?: Tabset
}>()

const emits = defineEmits(['buttonClicked', 'asNewFile'])

const $q = useQuasar()

const { getHandler } = useActionHandlers($q)

const handler = ref<TabActionMatcher>(new NoopAddUrlToTabsetHandler())
// const defaultAction = ref<ActionContext | undefined>(undefined)
const containedInTsCount = ref(0)
const animateAddtabButton = ref(false)
const currentTabsetId = ref<string | undefined>(undefined)
const alreadyInTabset = ref(false)
const actions = shallowRef<ComponentWithContext[]>([])

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (currentTabsetId.value = tsId))
})

watchEffect(() => {
  //console.log('defaultAction!!', props.currentChromeTab.url, props.folder)
  handler.value = getHandler(props.currentChromeTab.url, props.folder)
  // defaultAction.value = handler.value.defaultAction()
  // showExtraMenuItems()
  actions.value = handler.value.actions(currentTabsetId.value, {
    tabset: props.tabset,
    level: 'root',
    currentChromeTab: props.currentChromeTab,
    element: 'btn',
  })
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
  `Already contained in ${containedInTsCount.value} other tabsets. Click to add here as well.`
</script>

<style>
.q-btn-dropdown--simple * + .q-btn-dropdown__arrow {
  margin-left: 0;
  border: 1px solid red;
}

.q-btn-dropdown--split .q-btn-dropdown__arrow-container {
  padding: 0;
}
</style>
