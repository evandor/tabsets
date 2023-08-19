<template>
  <span class="text-blue-10">{{ shortenUrl() }}
    <q-tooltip class="tooltip">{{ url }}</q-tooltip>
  </span>
</template>

<script lang="ts" setup>

const props = defineProps({
  url: {type: String, required: true},
  hostnameOnly: {type: Boolean, default: false}
})

const shortenUrl = () => {
  if (props.hostnameOnly) {
    try {
      const theURL = new URL(props.url)
      return theURL.hostname
    } catch (e) {
      return "-"
    }
  }
  return props.url
  //return props.url.split('?')[0].replace("https://", "")
}
</script>
