<template>
  <span class="darkColors lightColors blueish">
    <Highlight :filter="props.filter" :text="props.label ? props.label : shortenUrl() || ''" />
    <q-tooltip v-if="props.hostnameOnly" class="tooltip">{{ url }}</q-tooltip>
  </span>
</template>

<script lang="ts" setup>
import Highlight from 'src/tabsets/widgets/Highlight.vue'

const props = defineProps<{
  url: string
  label?: string
  hostnameOnly: boolean
  filter?: string | undefined
}>()

const shortenUrl = () => {
  if (props.hostnameOnly) {
    try {
      const theURL = new URL(props.url)
      return theURL.hostname
    } catch (e) {
      return '-'
    }
  }
  return props.url
}
</script>

<style scoped lang="scss">
.body--dark .darkColors.blueish {
  color: $blue-2;
}

.body--light .lightColors.blueish {
  color: $blue-8;
}
</style>
