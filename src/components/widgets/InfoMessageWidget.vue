<template>

  <div class="q-pa-md q-gutter-sm" v-if="showHint()">
    <q-banner inline-actions rounded class="bg-yellow-1 text-black" style="border: 1px solid grey">
      <div class="row q-pa-xs">
        <div class="2">
          <q-icon name="o_lightbulb" color="warning" size="1.3em"/>
        </div>
        <div class="col text-right cursor-pointer" @click="hideMessage(props.ident)">x
          <q-tooltip>close this info message</q-tooltip>
        </div>
      </div>
      <div class="row q-pa-xs">
        <div class="2"></div>
        <div class="col text-caption">{{ props.hint }}</div>
      </div>
    </q-banner>
  </div>

</template>

<script lang="ts" setup>
import {useUiStore} from "stores/uiStore";
import {useTabsStore} from "stores/tabsStore";

const props = defineProps({
  ident: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    required: true
  },
  probability: {
    type: Number,
    default: 1
  }
})
const uiStore = useUiStore()
const tabsStore = useTabsStore()

const hideMessage = (ident: string) => useUiStore().hideInfoMessage(ident)

const showHint = () => uiStore.showMessage(props.ident, props.probability)

</script>
