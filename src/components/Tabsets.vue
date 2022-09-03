<!--<template>-->
<!--  <q-item-->
<!--    clickable-->
<!--    @click="openTabsetPage(id)"-->
<!--  >-->
<!--    <q-item-section-->
<!--      v-if="favIconUrl"-->
<!--      avatar-->
<!--    >-->
<!--      <q-img :src="favIconUrl" height="20px" width="20px"/>-->
<!--    </q-item-section>-->

<!--    <q-item-section>-->
<!--      <q-item-label>{{ title }}</q-item-label>-->
<!--      <q-item-label caption>{{ url }}</q-item-label>-->
<!--    </q-item-section>-->
<!--  </q-item>-->
<!--</template>-->

<!--<script setup lang="ts">-->

<!--import {useRouter} from "vue-router";-->

<!--const router = useRouter()-->

<!--export interface TabsetProps {-->
<!--  id: string;-->
<!--  title: string;-->
<!--  caption?: string;-->
<!--  url?: string;-->
<!--  favIconUrl?: string;-->
<!--}-->

<!--withDefaults(defineProps<TabsetProps>(), {-->
<!--  id: "0",-->
<!--  caption: '',-->
<!--  url: '#',-->
<!--  favIconUrl: '',-->
<!--});-->

<!--function openTabsetPage(id: string) {-->
<!--  // console.log("hier", id)-->
<!--  router.push('/tabsets/' + id)-->
<!--}-->
<!--</script>-->
