<template>
  <div class="q-ma-none" style="height: 100%; max-width: 100%">
    <q-scroll-area style="height: 100%">
      <InfoMessageWidget
        :probability="1"
        ident="groupByDomain_atLeastTwo"
        hint="In this view, you will see your tabs grouped by Domain" />

      <div class="q-pa-none">
        <ByDomainListWidget @domainSelected="(value: string) => showByDomainPage(value)" />
      </div>
    </q-scroll-area>
  </div>
</template>

<script lang="ts" setup>
import ByDomainListWidget from 'src/tabsets/widgets/ByDomainListWidget.vue'
import InfoMessageWidget from 'src/ui/widgets/InfoMessageWidget.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const showByDomainPage = (host: string) => {
  console.log('clicked', host)
  router.push('/bydomain/' + btoa(host))
}
</script>
