<template>
  <q-page padding>
    <q-toolbar class="text-primary">
      <div class="row fit">
        <div class="col-xs-12 col-md-5">
          <q-toolbar-title class="q-mb-lg">
            <div class="row justify-start items-baseline">
              <div class="col-1">
                <span v-if="htmlMetadata" class="text-dark">Archived Image for: {{ htmlMetadata.url }}</span>
                <span v-else class="text-dark"
                  >Archived Image for: <q-spinner-facebook color="primary" size="1em"
                /></span>
              </div>
            </div>
            <div class="text-caption">Created {{ date.formatDate(htmlMetadata?.created, 'DD.MM.YYYY HH:mm') }}</div>
          </q-toolbar-title>
        </div>
        <div class="col-xs-12 col-md-7 text-right">
          <!--          <q-btn-->
          <!--            flat dense icon="o_open_in_new"-->
          <!--            color="green"-->
          <!--            label="Open in new tab"-->
          <!--            class="q-mr-md"-->
          <!--            @click="openInNewTab">-->
          <!--            <q-tooltip>Open in new tab</q-tooltip>-->
          <!--          </q-btn>-->
        </div>
      </div>
    </q-toolbar>

    <img id="monitoringStartImg" />
  </q-page>
</template>

<script lang="ts" setup>
import { date } from 'quasar'
import Analytics from 'src/core/utils/google-analytics'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { SavedBlob } from 'src/snapshots/models/SavedBlob'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'
import { useSnapshotsStore } from 'src/snapshots/stores/SnapshotsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const snapshotId = ref<string>()
const htmlMetadata = ref<BlobMetadata | undefined>(undefined)
const currentBlob = ref<Blob | undefined>(undefined)
const tabId = ref<string>()
const blobId = ref<string>()
const pngs = ref<SavedBlob[]>([])
const current = ref(2)

onMounted(() => {
  Analytics.firePageViewEvent('MainPanelPngPage', document.location.href)
})

watchEffect(() => {
  snapshotId.value = route.params.snapshotId as string
  console.log(`got snapshotId ${snapshotId.value}`)
})

function setImage(index: number) {
  if (!currentBlob.value) {
    return
  }
  var urlCreator = window.URL || window.webkitURL
  var imageUrl = urlCreator.createObjectURL(currentBlob.value)
  console.log('imageUrl', imageUrl)
  const img1: HTMLImageElement | null = document.querySelector('#monitoringStartImg')
  if (img1) {
    img1.src = imageUrl
  }
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  if (snapshotId.value) {
    if (useSnapshotsStore().lastUpdate) {
      htmlMetadata.value = await useSnapshotsService().getMetadataById(snapshotId.value)
      console.log('metadata', htmlMetadata.value)
      currentBlob.value = await useSnapshotsService().getBlobFor(htmlMetadata.value!.blobId)
      setImage(0)
      //current.value = index
    }
  }
})

watchEffect(() => {
  tabId.value = route.params.tabId as string
  blobId.value = route.params.blobId as string
  if (blobId.value && useUiStore().dbReady) {
    // const tabId = suggestion.value['data' as keyof object]['tabId' as keyof object]
    // console.log("got tabId", tabId)
    //  pngs.value = await useSnapshotsService().getPngsForTab(tabId.value)
    console.log('pngs', pngs.value)
    setImage(0)
  }
})

watchEffect(() => {
  console.log('current', current.value)
  setImage(current.value - 1)
})
</script>
