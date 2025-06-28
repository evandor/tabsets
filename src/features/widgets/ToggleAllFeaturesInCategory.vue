<template>
  <q-icon
    class="q-ml-md"
    :class="deactiveFeatures.length > 0 ? 'cursor-pointer' : ''"
    :color="deactiveFeatures.length > 0 ? 'positive' : 'grey'"
    name="done_all"
    @click="activateAll()">
    <q-tooltip class="tooltip-small">Activate all features (without special permissions) in this category</q-tooltip>
  </q-icon>
  <q-icon
    class="q-ml-md"
    :class="activeFeatures.length > 0 ? 'cursor-pointer' : ''"
    :color="activeFeatures.length > 0 ? 'positive' : 'grey'"
    name="clear_all"
    @click="deactivateAll()">
    <q-tooltip class="tooltip-small">Deactivate all features in this category</q-tooltip>
  </q-icon>
</template>
<script lang="ts" setup>
import { AppFeatures } from 'src/app/models/AppFeatures'
import { FeatureType } from 'src/app/models/FeatureIdent'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { ActivateFeatureCommand } from 'src/features/commands/ActivateFeatureCommand'
import { DeactivateFeatureCommand } from 'src/features/commands/DeactivateFeatureCommand'
import { Feature } from 'src/features/models/Feature'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  category: FeatureType
}>()

const activeFeatures = ref<Feature[]>([])
const deactiveFeatures = ref<Feature[]>([])

watchEffect(() => {
  const allActiveFeatures = useFeaturesStore().activeFeatures
  activeFeatures.value = new AppFeatures().features
    .filter((f: Feature) => f.type === props.category)
    .filter((f: Feature) => allActiveFeatures.indexOf(f.ident.toLowerCase()) >= 0)
})
watchEffect(() => {
  const allActiveFeatures = useFeaturesStore().activeFeatures
  deactiveFeatures.value = new AppFeatures().features
    .filter((f: Feature) => f.type === props.category)
    .filter((f: Feature) => allActiveFeatures.indexOf(f.ident.toLowerCase()) < 0)
})

const activateAll = () => {
  console.log(`activate all features in ${props.category}`)
  deactiveFeatures.value.forEach((f: Feature) => {
    console.log('f', f)
    if (f.activateCommands.length <= 1) {
      useCommandExecutor().execute(new ActivateFeatureCommand(f.ident))
    }
  })
}

const deactivateAll = () => {
  console.log(`deactivate all features in ${props.category}`)
  activeFeatures.value.forEach((f: Feature) => {
    useCommandExecutor().execute(new DeactivateFeatureCommand(f.ident))
  })
}
</script>
