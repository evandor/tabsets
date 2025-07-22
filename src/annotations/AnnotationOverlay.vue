<template>
  <div class="bg-white q-pa-sm" style="border: 1px solid red">
    <div class="row">
      <div class="col-12">Remark</div>
    </div>
    <div class="row">
      <div class="col-12">
        <q-input filled v-model="remark" />
      </div>
    </div>
    <div class="row">
      <div class="col-12" style="border: 1px solid red">
        <ColorSelector @colorSet="(color: string) => (theColor = color)" />
      </div>
    </div>
    <div class="row">
      <div class="col-12 text-right">
        <q-btn label="save" size="xs" @click="saveAnnotation()" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ColorSelector from 'src/core/dialog/ColorSelector.vue'
import { ref } from 'vue'

const theColor = ref('')
const remark = ref('')

const saveAnnotation = () => {
  console.log('===>', remark.value, theColor.value)
}
</script>
