<template>
  <div>
    <span>{{ content }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ComponentSpan',
  props: {
    content: {
      type: String,
      required: false,
    },
  },
})
</script>
