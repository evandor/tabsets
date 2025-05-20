<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <!-- https://stackoverflow.com/questions/71703650/vuejs-view-is-not-refreshing-when-i-change-the-router-paramid-->
      <router-view :key="$route.path" />
    </q-page-container>
  </q-layout>
</template>
