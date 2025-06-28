<template>
  <q-page padding style="padding-top: 65px">
    <div class="q-ma-none">
      <InfoMessageWidget
        :probability="1"
        ident="groupByDomain_atLeastTwo"
        hint="This view lists all your tabs grouped by Domain" />

      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-sm">
            <ByDomainListWidget @domainSelected="(value: string) => showByDomainPage(value)" />
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Domain List">
        <template v-slot:iconsRight> </template>
      </ViewToolbarHelper>
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import Analytics from 'src/core/utils/google-analytics'
import ByDomainListWidget from 'src/tabsets/widgets/ByDomainListWidget.vue'
import InfoMessageWidget from 'src/ui/widgets/InfoMessageWidget.vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelByDomainList', document.location.href)
})

const showByDomainPage = (host: string) => {
  router.push('/sidepanel/bydomain/' + btoa(host))
}
</script>
