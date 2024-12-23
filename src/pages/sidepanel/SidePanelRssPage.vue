<template>
  <div class="q-ma-none">
    <q-toolbar class="text-primary lightgrey">
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-2">
              <q-icon
                name="chevron_left"
                class="cursor-pointer"
                @click="router.push('/sidepanel/rsslist')"
              >
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col-10">rss.title</div>
            <div class="col-1 text-right"></div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="row q-ma-none q-pa-sm">
      <div class="col-12">
        <div class="row q-mb-lg">
          <div class="col">
            <div class="text-subtitle1">rss.description</div>
            <div class="text-caption">
              Created date.formatDate(rss.published, 'DD.MM.YYYY HH:mm')
            </div>
          </div>
        </div>

        <div class="row q-mb-lg" v-for="entry in rss.items">
          <div class="col-5 q-pa-xs cursor-pointer">
            <!--            <q-img v-if="imageEnclosure(entry)"-->
            <!--                   @click="openInNewTab(entry.link)"-->
            <!--                   :src="imageEnclosure(entry)">-->
            <!--            </q-img>-->
          </div>
          <div class="col q-pa-xs">
            <div class="text-subtitle2" style="line-height: normal">
              {{ getAsHtml(entry, 'title') }}
            </div>
          </div>
          <div class="col-12 q-pa-xs">
            <!--            <div class="text-caption"> {{ entry.description }}</div>-->
            <!--            <div class="text-caption text-grey-8"> {{ formatDate(entry.published) }}</div>-->
            <!--            <q-tooltip>this entry was created at-->
            <!--              {{ date.formatDate(entry.published, 'DD.MM.YYYY HH:mm') }}-->
            <!--            </q-tooltip>-->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { date } from 'quasar'
import NavigationService from 'src/services/NavigationService'
import { formatDistance, parseISO } from 'date-fns'
import Analytics from 'src/core/utils/google-analytics'

const route = useRoute()
const router = useRouter()

const encodedUrl = ref()
const title = ref()
const rss = ref<{ items: Element[] }>({ items: [] })

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelRssPage', document.location.href)
})

watchEffect(async () => {
  encodedUrl.value = route.params.encodedUrl as string
  console.log('url3', atob(encodedUrl.value))

  if (encodedUrl.value) {
    fetch(atob(encodedUrl.value))
      .then((response) => response.text())
      .then((str) => new window.DOMParser().parseFromString(str, 'text/xml'))
      .then((data) => {
        console.log(data)

        const items = data.querySelectorAll('item')
        rss.value = {
          items: Array.from(items),
        }
      })
  }
})

const getAsHtml = (e: Element, identifier: string) => {
  return e.querySelector(identifier)?.innerHTML
}

const openInNewTab = (link: string) => NavigationService.openOrCreateTab([link])

const imageEnclosure = (entry: Element): string | undefined | null => {
  const enclosure: Element | null = entry.querySelector('enclosure')
  if (enclosure) {
    return enclosure.getAttribute('url')
  }
  return undefined
}

const formatDate = (timestamp: any | undefined) =>
  timestamp ? formatDistance(parseISO(timestamp), new Date(), { addSuffix: true }) : ''
</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey
</style>
