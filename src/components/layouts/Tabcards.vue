<template>
  <div class="row items-start">
    <div class="col-xs-12 col-sm-4 col-md-3 col-lg-2 q-pa-xs" v-for="tab in props.tabs">
      <q-card class="my-card" flat bordered style="height: 200px;max-height:200px; min-height: 200px;">
        <q-card-section horizontal>
          <q-card-section class="q-pt-xs">
            <div>
              <q-img
                class="rounded-borders"
                width="20px"
                height="20px"
                :src="tab.favIconUrl"
              />
            </div>
            <div class="text-overline">{{ getHost(tab.url) }}</div>
            <div class="text-h6 q-mt-sm q-mb-xs">{{ maxChar(20, tab.title) }}</div>
            <div class="text-caption text-grey wrap" style="overflow:hidden;">
              {{ maxChar(30, tab.url) }}
            </div>
          </q-card-section>

        </q-card-section>

        <q-separator/>

        <q-card-actions style="min-height:50px;max-height:50px">
          <q-btn flat round icon="event"/>
          <!--<q-btn flat>
            7:30PM
          </q-btn>
          <q-btn flat color="primary">
            Reserve
          </q-btn>-->
        </q-card-actions>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  tabs: {
    type: Array,
    required: true
  }
})

function getHost(urlAsString: string): string {
  const url = new URL(urlAsString)
  return url.host
}

function maxChar(max: number, t: string): string {
  if (t.length > max - 3) {
    return t.substring(0, max-3) + "..."
  }
  return t;
}
</script>
