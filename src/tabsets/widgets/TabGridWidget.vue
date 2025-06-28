<template>
  <q-card flat bordered style="border: 0px solid green">
    <q-card-section class="q-ma-none q-pa-xs cursor-pointer bg-primary text-white" style="width: 100%">
      <div class="row items-baseline">
        <ImageForTab :tab="props.tab" :shared-by-id="props.sharedById" />
      </div>
    </q-card-section>
    <q-card-section class="q-ma-none q-pa-xs bg-primary text-white">
      <div class="row fit">
        <div class="col-12 cursor-pointer ellipsis">
          <TabFaviconWidget :tab="tab" width="16px" height="16px" class="q-mr-sm" />
          <span @click="NavigationService.openOrCreateTab([props.tab.url || ''])">{{ shortUrl() }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import NavigationService from 'src/services/NavigationService'
import { useAuthStore } from 'src/stores/authStore'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import ImageForTab from 'src/tabsets/widgets/ImageForTab.vue'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { onMounted, ref, watchEffect } from 'vue'

const props = defineProps<{ tab: Tab; sharedById: string | undefined }>()

const imgFromBlob = ref<string>('')
const thumbnail = ref<string | undefined>(undefined)

onMounted(() => {
  const blobImgPath = props.tab.image
  if (blobImgPath && blobImgPath.startsWith('blob://')) {
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
})

const shortUrl = () => {
  if (props.tab.url) {
    return props.tab.url
      .replace('https://www.', '')
      .replace('http://www.', '')
      .replace('https://', '')
      .replace('http://', '')
  }
  return ''
}
const thumbnailFor = async (tab: Tab): Promise<string> => {
  return useThumbnailsService().getThumbnailFor(tab.id, props.sharedById ? props.sharedById : useAuthStore().user.uid)
}

watchEffect(() => {
  if (props.tab) {
    thumbnailFor(props.tab).then((tn: string) => {
      if (tn) {
        thumbnail.value = tn
      }
    })
  }
})
</script>
