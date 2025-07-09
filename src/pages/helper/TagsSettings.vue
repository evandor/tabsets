<template>
  <div class="q-pa-md q-gutter-sm">
    <!--    <q-banner rounded style="border: 1px solid orange">-->
    <!--      {{ $t('settings_adjust_general_appearance') }}-->
    <!--    </q-banner>-->

    <!--    <div class="row items-baseline">-->
    <!--      <InfoLine label="Categories">-->
    <!--        <q-select-->
    <!--          input-class="q-ma-none q-pa-none"-->
    <!--          borderless-->
    <!--          filled-->
    <!--          dense-->
    <!--          options-dense-->
    <!--          v-model="categories"-->
    <!--          use-input-->
    <!--          use-chips-->
    <!--          multiple-->
    <!--          hide-dropdown-icon-->
    <!--          input-debounce="0"-->
    <!--          new-value-mode="add-unique"-->
    <!--          @update:model-value="(val) => updatedCategories(val)">-->
    <!--          <template v-slot:selected>-->
    <!--            <q-chip-->
    <!--              v-for="cat in categories.sort()"-->
    <!--              @remove="removeCategory(cat)"-->
    <!--              dense-->
    <!--              square-->
    <!--              removable-->
    <!--              text-color="primary"-->
    <!--              class="q-my-none q-ml-xs q-mr-none">-->
    <!--              {{ cat.label }}-->
    <!--              <q-tooltip class="tooltip-small" v-if="useSettingsStore().has('DEBUG_MODE')">-->
    <!--                score {{ Math.round(cat.weight * 1000) / 10 }}%-->
    <!--              </q-tooltip>-->
    <!--            </q-chip>-->
    <!--          </template>-->
    <!--        </q-select>-->
    <!--      </InfoLine>-->
    <!--    </div>-->

    <div class="row items-baseline">
      <InfoLine label="Ignored Tags">
        <q-select
          input-class="q-ma-none q-pa-none"
          borderless
          filled
          dense
          options-dense
          v-model="tags"
          use-input
          use-chips
          multiple
          hide-dropdown-icon
          input-debounce="0"
          new-value-mode="add-unique"
          @update:model-value="(val) => updatedTags(val)">
          <template v-slot:selected>
            <q-chip
              v-for="tag in tags.sort()"
              @remove="removeTag(tag)"
              dense
              square
              removable
              text-color="primary"
              class="q-my-none q-ml-xs q-mr-none">
              {{ tag }}
            </q-chip>
          </template>
        </q-select>
      </InfoLine>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { TAGS_CATEGORIES, TAGS_IGNORED } from 'boot/constants'
import { LocalStorage } from 'quasar'
import { CategoryInfo } from 'src/core/models/TagInfo'
import InfoLine from 'src/core/pages/helper/InfoLine.vue'
import { ref } from 'vue'

const tags = ref<string[]>(LocalStorage.getItem(TAGS_IGNORED) || [])
const categories = ref<CategoryInfo[]>(LocalStorage.getItem(TAGS_CATEGORIES) || [])

const updatedTags = (v: string[]) => LocalStorage.setItem(TAGS_IGNORED, v)

const removeTag = (v: string) => {
  tags.value = tags.value.filter((t) => t !== v)
  LocalStorage.setItem(TAGS_IGNORED, tags.value)
}

const updatedCategories = (cats: CategoryInfo[]) => {
  categories.value = cats.map((v: any) => {
    if (typeof v == 'string') {
      return { label: v, weight: 1 }
    }
    return v
  })
  LocalStorage.setItem(TAGS_CATEGORIES, categories.value)
}

const removeCategory = (v: CategoryInfo) => {
  categories.value = categories.value.filter((t: CategoryInfo) => t.label !== v.label)
  LocalStorage.setItem(TAGS_CATEGORIES, categories.value)
}
</script>
