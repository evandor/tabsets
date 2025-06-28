<template>
  <Transition appear enter-active-class="animated fadeInRight" leave-active-class="animated fadeOutRight">
    <FilterWidget style="position: absolute; left: 10px; top: 5px; max-width: 200px" />
  </Transition>
</template>

<script lang="ts" setup>
import FilterWidget from 'src/core/widget/FilterWidget.vue'
</script>
