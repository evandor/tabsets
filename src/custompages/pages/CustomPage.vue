<template>
  <q-header style="background-color: grey">
    <div class="row">
      <div class="col-12 text-right">
        <q-icon v-if="!props.edit" name="edit" size="xs" class="q-mx-md q-my-xs cursor-pointer" @click="editPage()" />
        <q-icon v-else name="edit_off" size="xs" class="q-mx-md q-my-xs cursor-pointer" @click="editOff()" />
      </div>
    </div>
  </q-header>
  <!--  <q-page padding class="home-page column justify-center items-center">-->
  <q-page style="max-width: 1200px; margin: 0 auto">
    <div class="row">
      <div class="col-2"></div>
      <div class="col q-mt-lg">
        <component-list :page="page" :editable="props.edit" @content-changed="savePage()"></component-list>
      </div>
      <div class="col-2"></div>
    </div>
  </q-page>
</template>
<script lang="ts" setup>
import ComponentList from 'src/custompages/components/ComponentList.vue'
import { Page } from 'src/custompages/models/backend'
import { usePagesStore } from 'src/custompages/stores/pagesStore'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{ edit: boolean }>()

const page = ref<Page | undefined>(undefined)

const route = useRoute()

const pageId = route.params.pageId as string

watchEffect(() => {
  if (usePagesStore().initialized) {
    usePagesStore()
      .loadPage(pageId)
      .then((p: Page) => {
        page.value = p
      })
  }
})

const editOff = () => {
  const partsArray = window.location.href.split('/')
  partsArray.pop()
  window.location.href = partsArray.join('/')
}

const editPage = () => (window.location.href = window.location.href + '/edit')
const savePage = () => {
  if (page.value) {
    usePagesStore().updatePage(page.value)
  }
}
</script>
