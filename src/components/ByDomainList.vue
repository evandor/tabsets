<template>

  <div class="q-ma-none" style="height:100%;max-width:100%">
    <q-scroll-area style="height: 100%">

      <InfoMessageWidget
          :probability="1"
          ident="groupByDomain_atLeastTwo"
          hint="In this view, you will see your tabs grouped by Domain, for all domains having at least two entries"/>

      <div class="q-pa-none">
        <ByDomainListWidget @domainSelected="(value:string) => showByDomainPage(value)" />
<!--        <q-list>-->
<!--          <q-item clickable v-ripple v-for="[host,val] in groupedTabs"-->
<!--                  @click="showByDomainPage(host)">-->
<!--            <q-item-section>-->
<!--              <q-item-label overline>{{ host }}</q-item-label>-->
<!--              <q-item-label caption>{{ captionFor(val) }}</q-item-label>-->
<!--            </q-item-section>-->
<!--          </q-item>-->
<!--        </q-list>-->
      </div>

    </q-scroll-area>
  </div>

</template>

<script lang="ts" setup>

import {useRouter} from "vue-router";
import InfoMessageWidget from "components/widgets/InfoMessageWidget.vue";
import ByDomainListWidget from "components/widgets/ByDomainListWidget.vue";

const router = useRouter()

const showByDomainPage = (host: string) => {
  console.log("clicked", host)
  router.push("/bydomain/" + btoa(host))
}

</script>
