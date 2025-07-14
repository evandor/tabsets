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
        <div
          class="col-9 vertical-bottom q-ml-sm"
          :class="spaces.length > 0 ? 'cursor-pointer' : ''"
          style="border: 0 solid red">
          {{ title }}
          <q-menu :offset="[-85, 2]" v-if="spaces.length > 0">
            <q-list dense style="min-width: 200px">
              <q-item clickable v-close-popup v-for="space in spaces">
                <q-item-section @click="switchSpace(space)">{{ space.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>

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
import { Space } from 'src/spaces/models/Space'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref, watchEffect } from 'vue'

const showWatermark = ref(false)
const watermark = ref('')
const spaces = ref<Space[]>([])

const props = defineProps<{ title: string }>()
const closeWindow = () => window.close()

watchEffect(() => {
  const availableSpaces: Space[] = [...useSpacesStore().spaces.values()]
  const currentSpace = useSpacesStore().space
  spaces.value = availableSpaces
    .filter((s: Space) => s.label !== currentSpace?.label)
    .sort((s1: Space, s2: Space) => s1.label.localeCompare(s2.label))
})

const switchSpace = (s: Space) => {
  useSpacesStore().space = s
}
</script>
