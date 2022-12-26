<template>
  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in tabsWithLimit()">

      <TabcardPending :tab="tab" />


    </div>
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs">
      <q-card class="my-card" bordered v-if="props.tabs.length >= 1+MAX_TABS_TO_SHOW">
        <q-card-section class="bg-grey-1 text-black cursor-pointer">

          <div class="row items-baseline">

            <!-- favicon -->
            <div class="col-2 text-body1">
              &gt;&gt;&gt;
            </div>

            <!-- title or name if given -->
            <div class="col-10 text-subtitle1 ellipsis">
              more tabs...
            </div>

          </div>


          <div class="text-subtitle2 ellipsis text-secondary">
            {{ 1 + props.tabs.length - MAX_TABS_TO_SHOW }} more tabs to show

          </div>

        </q-card-section>


        <q-card-actions>
          <div class="row fit">
            <div class="col-12 text-right">
              <q-btn flat round color="positive" icon="double_arrow">
                <q-tooltip>Show All</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-actions>

      </q-card>
    </div>
  </div>


</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {Tab} from "src/models/Tab";
import TabsetService from "src/services/TabsetService";
import {MAX_TABS_TO_SHOW} from 'boot/constants'
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import TabcardPending from "src/components/layouts/TabcardPending.vue"
import {SavePendingTabToCurrentTabsetCommand} from "src/domain/commands/SavePendingTabToCurrentTabsetCommand";

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  }
})

const emits = defineEmits(['sendCaption', 'selectionChanged'])

const featureToggles = useFeatureTogglesStore()


function closeTab(tab: Tab) {
  NavigationService.closeTab(tab)
}

function ignoreTab(tab: Tab) {
  console.log("ignoring tab", tab)
  TabsetService.ignoreTab(tab)
  NavigationService.closeTab(tab)
}

const saveTab = (tab: Tab) => useCommandExecutor().executeFromUi(new SavePendingTabToCurrentTabsetCommand(tab))


const nameOrTitle = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title
const dynamicNameOrTitleModel = (tab: Tab) => tab.name ? tab.name : tab.chromeTab?.title

const selectionChanged = (val: any) => emits('selectionChanged', val)

const tabsWithLimit = () => {
  const allTabs = props.tabs
  if (allTabs.length > MAX_TABS_TO_SHOW) {
    return allTabs.slice(0, MAX_TABS_TO_SHOW - 1)
  }
  return allTabs
}

</script>

<style lang="sass" scoped>
.my-card
  width: 100%
</style>
