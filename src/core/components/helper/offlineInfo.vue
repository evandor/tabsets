<template>
  <!--    <div-->
  <!--      v-if="!useUiStore().networkOnline"-->
  <!--      class="q-ma-md q-pa-sm justify text-body1"-->
  <!--      style="border: 1px solid red; border-radius: 3px">-->
  <!--      Sorry, you seem to be offline... try to-->
  <!--      <a href="#" @click="reload()" class="cursor-pointer text-blue-8">reload</a> in some minutes.-->
  <!--    </div>-->

  <div class="text-center" v-if="!useUiStore().networkOnline">
    <FuzzyText
      text="offline?"
      :font-size="20"
      font-weight="500"
      color="#FFB738"
      :enable-hover="true"
      :base-intensity="0.05"
      :hover-intensity="0.15" />
  </div>

  <div
    v-else-if="networkSlow()"
    class="q-ma-md q-pa-sm justify text-body1"
    style="border: 1px dotted red; border-radius: 3px">
    Your network seems to be slow...
  </div>
</template>

<script lang="ts" setup>
import FuzzyText from 'src/TextAnimations/FuzzyText/FuzzyText.vue'
import { useUiStore } from 'src/ui/stores/uiStore'

const reload = () => window.location.reload()

const networkSlow = () => {
  var networkState = useUiStore().networkState
  if (!networkState) {
    return false
  }
  var type = networkState['type' as keyof object]
  //console.log('checking network type', type)
  if (['slow-2g', '2g', '3g'].indexOf(type) >= 0) {
    return true
  }
  return false
}
</script>
