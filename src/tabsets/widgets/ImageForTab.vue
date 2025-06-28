<template>
  <q-img
    v-if="thumbnail"
    style="border: 0 dotted white; border-radius: 3px; cursor: move"
    :ratio="16 / 9"
    :src="thumbnail">
    <q-tooltip class="tooltip" :delay="1000" v-if="useSettingsStore().has('DEBUG_MODE')">Thumbnail</q-tooltip>
  </q-img>
  <q-img
    v-else-if="props.tab.image && props.tab.image.startsWith('blob://')"
    no-spinner
    style="border: 0 dotted white; border-radius: 5px"
    :src="imgFromBlob">
    <q-tooltip class="tooltip" :delay="1000" v-if="useSettingsStore().has('DEBUG_MODE')"
      >tab.image typeof blob
    </q-tooltip>
  </q-img>
  <q-img
    v-else-if="props.tab.image"
    style="border: 0 dotted white; border-radius: 5px"
    :src="props.tab.image"
    no-spinner>
    <q-tooltip class="tooltip" :delay="1000" v-if="useSettingsStore().has('DEBUG_MODE')">tab.image other </q-tooltip>
  </q-img>
  <q-img
    v-else
    no-spinner
    style="border: 0 dotted white; border-radius: 3px; cursor: move"
    :ratio="16 / 9"
    src="https://placehold.co/600x400?text=no+thumbnail" />
</template>
<script lang="ts" setup>
import { useSettingsStore } from 'src/core/stores/settingsStore'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { useAuthStore } from 'stores/authStore'
import { ref, watchEffect } from 'vue'

const props = defineProps<{ tab: Tab; sharedById: string | undefined }>()

const imgFromBlob = ref<string>('')
const thumbnail = ref<string | undefined>(undefined)

watchEffect(() => {
  if (useTabsetsStore().loaded) {
    const blobImgPath = props.tab.image
    if (blobImgPath && blobImgPath.startsWith('blob://')) {
      console.log('starting with blob', blobImgPath)
      useTabsetService()
        .getBlob(blobImgPath.replace('blob://', ''))
        .then((res) => {
          let reader = new FileReader()
          reader.readAsDataURL(res.content)
          reader.onloadend = function () {
            let base64data = reader.result
            if (base64data) {
              imgFromBlob.value = base64data as string
            }
          }
        })
        .catch((err) => console.error(err))
    }
  }
})

const thumbnailFor = async (tab: Tab): Promise<string> => {
  return useThumbnailsService().getThumbnailFor(tab.id, props.sharedById ? props.sharedById : useAuthStore().user.uid)
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  if (props.tab) {
    //console.log('>>>getting for ', props.tab.id, props.sharedById)
    try {
      thumbnail.value = await thumbnailFor(props.tab)
    } catch (err: any) {
      console.log('problem getting thumbnail', err)
    }
    // .then((tn: string) => {
    // console.log('data', tn)
    // if (tn) {
    //   thumbnail.value = tn
    // }
    //})
  }
})
</script>
