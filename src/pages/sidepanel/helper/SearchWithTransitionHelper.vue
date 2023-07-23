<template>
  <Transition
              appear
              enter-active-class="animated fadeInRight"
              leave-active-class="animated fadeOutRight">
    <SearchWidget
      :fromPanel="true"
      style="position: absolute; left:10px;top:5px;max-width:260px"/>
  </Transition>

</template>

<script lang="ts" setup>

import SearchWidget from "components/widgets/SearchWidget.vue";
</script>
