<template>
  <pre>{{ payload }}</pre>
</template>

<script lang="ts" setup>
import { RestApi, RestApiIdent } from 'src/rest/RestApi'
import { RestApiDefinitions } from 'src/rest/RestApiDefinitions'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// const api = ref(route.params.api)
const payload = ref<any>({})

onMounted(async () => {
  console.log('route', route.path)
  const api: RestApi | undefined = RestApiDefinitions.getApi(route.params.api as RestApiIdent)
  console.log('api', api)
  if (api) {
    const json = await api.get([])
    payload.value = json
  }
  // const res = await fetch(`http://127.0.0.1:27123/vault/${filename.value}`, {
  //   headers: {
  //     Accept: 'application/vnd.olrapi.note+json',
  //     Authorization: 'Bearer bd6fc2c6598ef3bbf8501b9d295367f73994cd037516f53e645f94d6557937be',
  //   },
  // })
  // const json = await res.json()
  // console.log('res', json)
  // payload.value = json
})
</script>
