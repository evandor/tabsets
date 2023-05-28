<template>
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <q-toolbar-title>
        <div class="row justify-start items-baseline">
          Note
        </div>
      </q-toolbar-title>
    </div>
  </q-toolbar>

  <div class="row items-baseline q-ma-lg">
    <div class="col-2">
      <q-img
        class="rounded-borders"
        width="32px"
        height="32px"
        :src="tab?.chromeTab?.favIconUrl">
        <q-tooltip>
          {{ tab?.chromeTab?.favIconUrl }} / {{
            tab?.chromeTab?.id
          }} / {{ tab.id }}
        </q-tooltip>
      </q-img>
    </div>
    <div class="col-10 text-body1 ellipsis">
      ---
    </div>
    <div class="col-12 text-body2 ellipsis">
      {{ tab?.chromeTab?.title }}
    </div>

    <div class="col-12">
      <div class="text-overline ellipsis">
        {{ tab?.history[0] }}&nbsp;<q-icon name="launch" color="secondary"
                                               @click.stop="NavigationService.openOrCreateTab(tab?.history[0] || '' )"></q-icon>
      </div>
    </div>
  </div>

  <div class="row items-baseline q-ma-none">
    <div class="col-7">
      <div class="row items-baseline q-ma-lg">
        <div class="col-3 text-subtitle1">
          Description
        </div>
        <div class="col-9 text-subtitle2">
          {{ tab?.description }}
        </div>
      </div>
      <div class="row items-baseline q-ma-lg" v-if="tab?.longDescription">
        <div class="col-3 text-subtitle1">
          Long Description
        </div>
        <div class="col-9 text-subtitle2" v-if="tab?.longDescription" v-html="tab?.longDescription"></div>
      </div>
      <div class="row items-baseline q-ma-lg" v-if="tab?.author">
        <div class="col-3 text-subtitle1">
          Author
        </div>
        <div class="col-9 text-subtitle2">
          {{ tab?.author }}
        </div>
      </div>
      <div class="row items-baseline q-ma-lg" v-if="tab?.date">
        <div class="col-3 text-subtitle1">
          Date
        </div>
        <div class="col-9 text-subtitle2">
          {{ tab?.date }}
        </div>
      </div>
      <div class="row items-baseline q-ma-lg" v-if="tab?.lastModified">
        <div class="col-3 text-subtitle1">
          Last Modified
        </div>
        <div class="col-9 text-subtitle2">
          {{ tab?.lastModified }}
        </div>
      </div>
      <div class="row items-baseline q-ma-lg" v-if="tab?.keywords">
        <div class="col-3 text-subtitle1">
          Keywords
        </div>
        <div class="col-9 text-subtitle2">
          {{ tab?.keywords }}
        </div>
      </div>
      <div class="row items-baseline q-ma-lg" v-if="tab?.image">
        <div class="col-3 text-subtitle1">
          Image
        </div>
        <div class="col-9 text-subtitle2">
          {{ tab?.image }}<br>
          <q-img :src="tab?.image"/>
        </div>
      </div>
    </div>
    <div class="col-1"></div>
    <div class="col-4">
      <div class="row q-ma-lg">
        <div class="col-5 text-subtitle1">
          Created
        </div>
        <div class="col-7 text-subtitle2">
          {{ formatDate(tab?.created) }}
          <q-tooltip>
            {{ date.formatDate(tab?.created, 'DD.MM.YYYY HH:mm') }}
          </q-tooltip>
        </div>
        <div class="col-5 text-subtitle1">
          Updated
        </div>
        <div class="col-7 text-subtitle2">
          {{ formatDate(tab?.updated) }}
          <q-tooltip>
            {{ date.formatDate(tab?.updated, 'DD.MM.YYYY HH:mm') }}
          </q-tooltip>
        </div>
        <div class="col-5 text-subtitle1">
          last Active
        </div>
        <div class="col-7 text-subtitle2">
          {{ formatDate(tab?.lastActive) }}
          <q-tooltip>
            {{ date.formatDate(tab?.lastActive, 'DD.MM.YYYY HH:mm') }}
          </q-tooltip>
        </div>
        <div class="col-5 text-subtitle1">
          activated#
        </div>
        <div class="col-7 text-subtitle2">
          {{ tab?.activatedCount }}
        </div>
      </div>
    </div>
  </div>

</template>

<script lang="ts" setup>

import {ref, watchEffect} from "vue";
import {useRoute} from "vue-router";
import NavigationService from "src/services/NavigationService";
import {date} from "quasar";
import {useTabsStore} from "stores/tabsStore";
import {Tab} from "src/models/Tab";
import {useUtils} from "src/services/Utils";

const {formatDate} = useUtils()

const route = useRoute()

const noteId = ref<string | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)

watchEffect(() => {
  noteId.value = route.params.noteId as unknown as string
  tab.value = useTabsStore().getTab(noteId.value)
})

</script>
