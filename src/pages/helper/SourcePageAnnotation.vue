<template>
  <div class="row q-ma-none q-pa-sm" style="border: 0px solid #bfbfbf; border-radius: 5px">
    <div class="col-10 text-subtitle2">
      {{ currentSelectionId ? 'Update Annotation' : 'Add Annotation' }}
    </div>
    <div class="col text-right cursor-pointer">
      <q-icon name="close" @click="emits('closeView')" />
    </div>

    <div class="col-12 ellipsis-2 q-my-sm">
      <q-input
        dense
        outlined
        type="text"
        v-model="currentSelectionTitle"
        label="Title"
        autofocus
        required
        autocomplete />
    </div>

    <div class="col-12 q-my-sm">
      <q-input
        dense
        type="textarea"
        outlined
        v-model="currentSelectionRemark"
        label="Remark"
        placeholder="add a remark for this selection"
        rows="3" />
      <!--      <q-btn label="clear" size="xs" @click="currentSelectionRemark = undefined"/>-->
    </div>
    <div class="col-12 q-my-sm">
      <q-radio keep-color v-model="currentSelectionColor" val="grey" color="grey" />
      <q-radio keep-color v-model="currentSelectionColor" val="#FFFF7B" color="yellow" />
      <q-radio keep-color v-model="currentSelectionColor" val="#F44336" color="red" />
      <q-radio keep-color v-model="currentSelectionColor" val="#8BC34A" color="green" />
      <q-radio keep-color v-model="currentSelectionColor" val="#29B6F6" color="blue" />
    </div>
    <div class="col-12 ellipsis-2 text-right">
      <q-btn
        size="sm"
        :label="props.selectionId ? 'update' : 'create Selection'"
        :disable="currentSelectionTitle ? currentSelectionTitle.trim().length === 0 : true"
        @click="createOrUpdateAnnotation()" />
    </div>
    <!--    <div>{{props}}</div>-->
  </div>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { Annotation } from 'src/snapshots/models/Annotation'
import { BlobMetadata } from 'src/snapshots/models/BlobMetadata'
import { useSnapshotsService } from 'src/snapshots/services/SnapshotsService'
import { PropType, ref } from 'vue'

const props = defineProps({
  sourceId: { type: String, required: true },
  snapshotId: { type: String, required: false },
  selectionId: { type: String, required: false },
  selectionText: { type: String, required: true },
  selectionTitle: { type: String, default: undefined },
  selectionColor: { type: String, default: 'grey' },
  selection: { type: Object as PropType<Object | undefined>, required: true },
  selectionViewPort: { type: Object, required: false },
  selectionRect: { type: Object, required: false },
  selectionRemark: { type: String, required: false },
  metadata: { type: Object as PropType<BlobMetadata>, required: true },
})

const emits = defineEmits(['setAnnotations', 'closeView'])

const currentSelectionRemark = ref<string | undefined>(props.selectionRemark)
const currentSelectionTitle = ref<string | undefined>(props.selectionTitle)
const currentSelectionColor = ref<string | undefined>(props.selectionColor)
const currentSelectionId = ref<string | undefined>(undefined)
const currentSelectionIndex = ref<number>(0)

const createOrUpdateAnnotation = async () => {
  let as: Annotation[] = []
  if (!currentSelectionId.value) {
    // new annotation
    as = await useSnapshotsService().createAnnotation(
      props.snapshotId || '',
      props.selection,
      props.selectionText,
      props.selectionRect || {},
      props.selectionViewPort || {},
      currentSelectionTitle.value || '???',
      currentSelectionRemark.value,
      currentSelectionColor.value,
    )
  } else {
    // existing annotation
    const a: Annotation | undefined = _.find(props.metadata.annotations, {
      id: currentSelectionId.value,
    })
    if (a) {
      a.title = currentSelectionTitle.value!
      a.comment = currentSelectionRemark.value
      a!.color = currentSelectionColor.value || 'grey'
      as = await useSnapshotsService().updateAnnotation(props.sourceId, a, currentSelectionIndex.value)
    }
  }
  // setAnnotations(as)
  //currentSelectionText.value = undefined
  console.log('emitting', as)
  emits('setAnnotations', as)
}
</script>
