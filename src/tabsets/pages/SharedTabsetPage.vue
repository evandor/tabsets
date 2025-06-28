<!-- SharedTabsetPage -->
<template>
  <q-header class="bg-white" style="max-width: 1200px; margin: 0 auto">
    <div class="row q-ma-sm q-mb-lg">
      <div class="col-6 text-left text-primary cursor-pointer">Tabsets PRO</div>
      <div class="col-6 text-right text-primary cursor-pointer">
        <span @click="login()">Log in</span> / <span @click="signup()">Sign up</span>
      </div>
    </div>
  </q-header>
  <!--  <TabList-->
  <!--    v-if="tabset"-->
  <!--    group="otherTabs"-->
  <!--    :tabsetId="tabset.id"-->
  <!--    :tabset="tabset"-->
  <!--    :tabsetSorting="tabset.sorting"-->
  <!--    :tabsetSharedId="tabset.sharing?.sharedId!"-->
  <!--    :tabs="tabset.tabs"-->
  <!--    :detailLevel="'MAXIMAL'" />-->

  <q-list v-if="tabset">
    <!--    <TabListHelper-->
    <!--      group="group"-->
    <!--      :tabset-id="tabset.id"-->
    <!--      :tabset="tabset"-->
    <!--      :tabset-shared-id="tabset.sharing.sharedId!"-->
    <!--      :tabs="tabset.tabs"-->
    <!--      :detailLevel="'MAXIMAL'" />-->

    <q-item clickable v-ripple v-for="tab in tabset.tabs" class="q-ma-md q-pa-xs q-py-md">
      <q-item-section
        class="q-mr-none q-mt-xs text-left"
        style="justify-content: start; width: 150px; max-width: 150px">
        <!--        <TabListIconItem :tabset="tabset" :tab="tab" :detail-level="'MAXIMAL'" />-->

        <div class="flex-center">
          <ImageForTab :tab="tab" :shared-by-id="tabset?.sharing.sharedById" />
        </div>
      </q-item-section>

      <!-- middle part: name, title, description, url && note -->
      <q-item-section class="q-mb-xs q-mt-xs q-mx-none q-pa-none">
        <SharedTabListMainItem
          :tabset="tabset"
          :filter="undefined"
          :tab="tab"
          :showCommentsForMinimalDetails="true"
          :detail-level="'MAXIMAL'" />
      </q-item-section>

      <!-- right part -->
      <slot name="actionPart"> </slot>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import Analytics from 'src/core/utils/google-analytics'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import ImageForTab from 'src/tabsets/widgets/ImageForTab.vue'
import SharedTabListMainItem from 'src/tabsets/widgets/tabListItems/SharedTabListMainItem.vue'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const tabset = ref<Tabset | undefined>(undefined)

onMounted(() => {
  Analytics.firePageViewEvent('SharedTabsetPage', document.location.href)
})

watchEffect(() => {
  console.log('got', route.params.sharedId)
  if (route.params.sharedId) {
    useTabsetsStore()
      .selectCurrentTabset(route.params.sharedId as string)
      .then((ts: Tabset | undefined) => (tabset.value = ts))
  } else {
    tabset.value = useTabsetsStore().getCurrentTabset
  }
})

const signup = () => {
  router.push('/mainpanel/login')
}
const login = () => {
  router.push('/mainpanel/login')
}
</script>
