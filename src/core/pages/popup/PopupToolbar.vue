<template>
  <!-- PopupToolbar -->
  <q-toolbar class="q-pa-none" style="border: 0 solid black">
    <q-toolbar-title>
      <div v-if="showWatermark" id="watermark">{{ watermark }}</div>
      <div class="row">
        <div class="col-1" style="border: 0 solid red; width: 30px">
          <slot name="left">
            <q-img src="/icons/favicon-32x32.png" width="26px" height="26px" />
          </slot>
        </div>
        <div class="col-9 vertical-bottom q-ml-sm" style="border: 0 solid red">{{ title }}</div>

        <div class="col text-right q-mr-xs" v-if="!useUiStore().appLoading" style="border: 0 solid green">
          <slot name="iconsRight">
            <q-icon name="o_close" size="xs" class="cursor-pointer q-mr-sm" @click="closeWindow" />
            <!--            <q-btn-->
            <!--              icon="open_in_new"-->
            <!--              flat-->
            <!--              :disabled="sidepanelEnabled"-->
            <!--              size="14px"-->
            <!--              @click="openBrowserSidepanel()"-->
            <!--              class="cursor-pointer" />-->
          </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref } from 'vue'

const showWatermark = ref(false)
const watermark = ref('')

const props = defineProps<{ title: string }>()
const closeWindow = () => window.close()
</script>
