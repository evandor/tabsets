<template>
  <template v-if="!filter">
    <span>{{ text }}</span>
    <slot name="popup" />
  </template>
  <Highlighter
    v-else
    class="cursor-pointer fit no-wrap my-highlight"
    :highlightStyle="{ backgroundColor: 'lightgrey' }"
    :searchWords="[props.filter!]"
    :autoEscape="true"
    :textToHighlight="text">
  </Highlighter>
</template>
<script lang="ts" setup>
import Highlighter from 'vue-highlight-words'

const props = defineProps<{ filter: string | undefined; text: string }>()
</script>
