<template>

  <q-img src="thumbnail"/>

</template>

<script setup lang="ts">
import TabsetService from "src/services/TabsetService";
import {ref} from "vue";

const props = defineProps({
  tab: {
    type: Object,
    required: true
  }
})

const thumbnail = ref('')
TabsetService.getThumbnailFor(props.tab)
  .then(data => thumbnail.value = data)
  .catch(err => console.error("error retrieving thumbnail data", err))

// const thumbnail = (tab: Tab) => {
//
// }

</script>
