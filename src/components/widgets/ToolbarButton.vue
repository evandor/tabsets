<template>

  <template v-if="restricted">
    <Transition name="colorized-appear">
      <q-btn v-if="!props.feature || useFeaturesStore().hasFeature(FeatureIdent[props.feature as keyof typeof FeatureIdent])"
             :flat="!outlinedIfActive()"
             :outline="outlinedIfActive()"
             name="sidebar" :icon="props.icon" :size="btnSize"
             @click="tabsClicked(props.drawer)">
        <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">{{ props.tooltip }}
        </q-tooltip>
      </q-btn>
    </Transition>
  </template>
  <template v-else>
    <q-btn
      :flat="!outlinedIfActive()"
      :outline="outlinedIfActive()"
      name="sidebar" :icon="props.icon"
      :size="btnSize"
      @click="tabsClicked(props.drawer)">
      <q-tooltip class="tooltip" anchor="center right" self="center left" :delay="200">{{ props.tooltip }}
      </q-tooltip>
    </q-btn>
  </template>

</template>

<script lang="ts" setup>
import {DrawerTabs, useUiStore} from "src/ui/stores/uiStore";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/FeatureIdent";
import {useFeaturesStore} from "src/features/stores/featuresStore";

const props = defineProps({
  feature: {type: String, required: false},
  drawer: {type: String, required: true},
  restricted: {type: Boolean, default: true},
  icon: {type: String, required: true},
  tooltip: {type: String, required: true}
})

const btnSize = "12px"

const outlinedIfActive = (): boolean => {
  const stack = useUiStore().rightDrawerViewStack
  if (stack && stack.length > 0) {
    return stack[stack.length - 1] === props.drawer
  }
  return false
}

const tabsClicked = (tab: DrawerTabs, data: object = {}) => useUiStore().rightDrawerSetActiveTab(tab)


</script>
