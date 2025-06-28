<template>
  <div class="col-3 text-body1">
    {{ props.label
    }}<span v-if="helpLink" class="q-ml-sm"
      ><q-icon name="sym_o_help" class="cursor-pointer" @click="useNavigationService().browserTabFor(helpLink)"
    /></span>
  </div>
  <div class="col-7">
    <slot></slot>
  </div>
  <div class="col"></div>
</template>

<script lang="ts" setup>
import { useNavigationService } from 'src/core/services/NavigationService'

const props = defineProps({
  label: { type: String, required: false },
  helpLink: { type: String, required: false },
})
</script>
