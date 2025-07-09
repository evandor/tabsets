<template>
  <div class="row q-my-xs darkInDarkMode brightInBrightMode" style="border: 0 solid blue">
    <div class="col-2 q-ml-xs q-mt-sm text-right text-caption text-grey-8" style="border: 0 solid red">
      {{ title }} <q-spinner v-if="loading" />
    </div>
    <div class="col q-mx-md" style="border: 0 solid red">
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
type Props = { title: String; loading?: boolean }
const props = withDefaults(defineProps<Props>(), { loading: false })
</script>
