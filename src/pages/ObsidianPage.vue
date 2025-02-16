<template>
  <pre>{{ payload }}</pre>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const filename = ref(route.params.file)
const payload = ref<object>({})

console.log('fiename', filename.value)

onMounted(async () => {
  const res = await fetch(`http://127.0.0.1:27123/vault/${filename.value}`, {
    headers: {
      Accept: 'application/vnd.olrapi.note+json',
      Authorization: 'Bearer bd6fc2c6598ef3bbf8501b9d295367f73994cd037516f53e645f94d6557937be',
    },
  })
  const json = await res.json()
  console.log('res', json)
  payload.value = json
})
</script>
