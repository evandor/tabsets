<template>
  <q-btn v-if="showButton()"
         :icon="props.icon"
         :class="leftButtonClass()"
         :color="isActive() ? 'secondary':'primary'"
         size="8px"
         @click="toggleView()">
    <q-tooltip v-if="props.tooltip" class="tooltip">{{ props.tooltip}}</q-tooltip>
  </q-btn>
</template>

<script lang="ts" setup>

import {SidePanelView, useUiStore} from "stores/uiStore";
import {PropType} from "vue";
import {useRouter} from "vue-router";

const props = defineProps({
  sidePanelView: {type: Object as PropType<SidePanelView>, required: true},
  icon: {type: String, required: true},
  tooltip: {type: String, required: false}
})

const router = useRouter()

const isActive = () => useUiStore().sidePanelIsActive(props.sidePanelView)
const activateView = (view: SidePanelView) => useUiStore().sidePanelSetActiveView(view)

const showButton = () => props.sidePanelView?.showButton()
const leftButtonClass = () => "q-my-xs q-ml-xs q-px-xs"

const toggleView = () => {
  if (isActive()) {
    activateView(SidePanelView.MAIN)
    router.push("/sidepanel")
  } else {
    activateView(props.sidePanelView)
    router.push("/sidepanel/" + props.sidePanelView)
  }
}

</script>
