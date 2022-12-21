<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-7">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-12">
                <span class="text-primary">
                  {{ rss.title }}
                </span>

            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-5 text-right">
        <q-btn
          flat dense icon="o_open_in_new"
          color="green"
          label="Open in new tab"
          class="q-mr-md"
          @click="openInNewTab(rss.link)"
        >
          <q-tooltip>Open in new tab</q-tooltip>
        </q-btn>

      </div>
    </div>
  </q-toolbar>

  <q-page padding class="greyBorderTop">

    <div class="row q-mb-lg">
      <div class="col">
        <div class="text-subtitle1">{{ rss.description }}</div>
        <div class="text-caption">Created {{ date.formatDate(rss.published, 'DD.MM.YYYY HH:mm') }}</div>
      </div>
    </div>

    <div class="row q-mb-md q-gutter-lg" v-for="entry in rss.entries">
      <div class="col-2">
        <q-img v-if="imageEnclosure(entry)"
               :src="imageEnclosure(entry)"
        />
      </div>
      <div class="col">
        <div class="text-subtitle1 cursor-pointer link" @click="openInNewTab(entry.link)">{{ entry.title }}</div>
        <div class="text-subtitle2"> {{ entry.description }}</div>
        <div class="text-caption text-grey-8"> {{ formatDate(entry.published) }}</div>
        <q-tooltip>this entry was created at
          {{ date.formatDate(entry.published, 'DD.MM.YYYY HH:mm') }}
        </q-tooltip>
      </div>
    </div>

  </q-page>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import {date} from "quasar"
import {read} from '@extractus/feed-extractor'
import NavigationService from "src/services/NavigationService";
import {formatDistance, parseISO} from "date-fns";

const route = useRoute()

const encodedUrl = ref()
const title = ref()
const rss = ref({})

const opts = {
  includeEntryContent: true,
  includeOptionalElements: true,
  useISODateFormat: true,
  normalization: true,
  getExtraFeedFields: (feedData: any) => {
    //console.log("feedData", feedData)
    return {
      subtitle: feedData.subtitle || '',
      image: feedData.image || undefined,
      guid: feedData.guid || ''
    }
  },
  getExtraEntryFields: (feedEntry: any) => {
    //console.log("feedEntry", feedEntry)
    const {
      enclosure,
      category
    } = feedEntry
    return {
      enclosure: {
        url: enclosure ? enclosure['@_url'] : undefined,
        type: enclosure ? enclosure['@_type'] : 'undefined',
        length: enclosure ? enclosure['@_length'] : 'undefined'
      },
      content: feedEntry['content:encoded'],
      category
    }
  }
//  useISODateFormat: useISODateFormat !== 'n',
//  normalization: normalization !== 'n'
}


watchEffect(() => {
  encodedUrl.value = route.params.encodedUrl as string
  if (encodedUrl.value) {

    read(atob(encodedUrl.value), opts)
      .then(res => {
        //console.log("res", res)
        rss.value = res
      })
  }
})

const openInNewTab = (link: string) => NavigationService.openOrCreateTab(link)

const imageEnclosure = (entry: any): string | undefined => {
  if (entry.enclosure && entry.enclosure.type.indexOf('image') >= 0) {
    return entry.enclosure.url
  }
  return undefined
}

const formatDate = (timestamp: any | undefined) =>
  timestamp ? formatDistance(parseISO(timestamp), new Date(), {addSuffix: true}) : ""

</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey

.link
  color: #1a0dab

.link:visited
  color: #671da8

.link:hover
  color: #1a0dab
  text-decoration: underline

</style>
