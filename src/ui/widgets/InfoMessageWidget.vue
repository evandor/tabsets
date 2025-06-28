<template>
  <q-banner inline-actions rounded class="hint" v-if="showHint()">
    <div class="row q-pa-xs">
      <div class="col-11 text-body1" :class="$q.dark.isActive ? 'text-grey-3' : 'text-grey-8'">
        <q-icon name="o_lightbulb" color="warning" size="1.3em" />
        {{ props.hint }}
        <slot></slot>
      </div>
      <div class="col text-right">
        <q-icon name="o_cancel" size="xs" class="cursor-pointer" color="primary" @click="hideMessage(props.ident)">
          <q-tooltip>close this info message</q-tooltip>
        </q-icon>
      </div>
    </div>
  </q-banner>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useUiStore } from 'src/ui/stores/uiStore'

const $q = useQuasar()

const props = defineProps({
  ident: { type: String, required: true },
  hint: { type: String, required: false },
  cssClass: { type: String, default: 'hint' },
  // even if this is set to 1.0, showMessage might return "false", e.g.
  // when another message is already shown
  probability: { type: Number, default: 1 },
  // the hint is shown unless it has been disabled by the user
  forceDisplay: { type: Boolean, default: false },
})
const uiStore = useUiStore()

const hideMessage = (ident: string) => useUiStore().hideInfoMessage(ident)

const showHint = () => uiStore.showMessage(props.ident, props.probability, props.forceDisplay)
</script>
