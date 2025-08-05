<template>
  <!--    <div-->
  <!--      v-if="!useUiStore().networkOnline"-->
  <!--      class="q-ma-md q-pa-sm justify text-body1"-->
  <!--      style="border: 1px solid red; border-radius: 3px">-->
  <!--      Sorry, you seem to be offline... try to-->
  <!--      <a href="#" @click="reload()" class="cursor-pointer text-blue-8">reload</a> in some minutes.-->
  <!--    </div>-->

  <div
    class="q-pa-none q-ma-none q-mb-md"
    v-if="showOfflineBanner"
    style="border: 2px solid orange; border-radius: 3px">
    <q-banner rounded dense class="text-black">
      <q-banner rounded class="text-black">
        Looks like you are offline?

        <template v-slot:action>
          <q-btn flat color="black" label="Dismiss" @click="showOfflineBanner = false" />
        </template>
      </q-banner>
    </q-banner>
  </div>

  <div
    class="q-pa-none q-ma-none q-mb-md"
    v-else-if="showNetworkSlowBanner"
    style="border: 2px solid orange; border-radius: 3px">
    <q-banner rounded dense class="text-black">
      <q-banner rounded class="text-black">
        Your network seems to be slow...

        <template v-slot:action>
          <q-btn flat color="black" label="Dismiss" @click="showNetworkSlowBanner = false" />
        </template>
      </q-banner>
    </q-banner>
  </div>
</template>

<script lang="ts" setup>
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'

const showOfflineBanner = ref(false)
const showNetworkSlowBanner = ref(false)

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

watchEffect(() => (showOfflineBanner.value = !useUiStore().networkOnline))
watchEffect(() => (showNetworkSlowBanner.value = networkSlow()))
</script>
