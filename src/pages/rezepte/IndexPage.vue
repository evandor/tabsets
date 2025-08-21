<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Linker Leerbereich (nur Desktop sichtbar) -->
      <div class="col-0 col-md-1" />

      <!-- Hauptinhalt -->
      <div class="col-12 col-md-8">
        <q-input filled v-model="search" label="Suche nach Rezept" />

        <q-card flat class="q-pa-sm q-my-md">
          <div class="row q-gutter-sm">
            <q-btn
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              flat
              rounded
              size="md"
              :class="['badge-green', { active: selectedCategory === cat }, 'q-mb-sm', 'q-mr-sm']"
              @click="selectedCategory = cat" />
          </div>
        </q-card>

        <div class="row q-col-gutter-md">
          <div v-for="recipe in filteredRecipes" :key="recipe.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <RecipeCard :recipe="recipe" :tabset="tabset" />
          </div>
        </div>
      </div>

      <!-- Werbung rechts (nur auf Desktop sichtbar) -->
      <div class="col-0 col-md-3">
        <div class="q-pa-md bg-grey-2 text-grey-7 rounded-borders">
          <p>🔸 Werbung</p>
          <p style="font-size: 0.85em">Hier könnte Ihre Anzeige stehen.</p>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import RecipeCard from 'components/RecipeCard.vue'
import { uid } from 'quasar'
import { Rezept } from 'src/bibblyCollections/recipes/models/Rezept'
import { useRecipesServices } from 'src/bibblyCollections/recipes/RecipesServices'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useLdJsonUtils } from 'src/core/services/LdJsonUtils'
import Analytics from 'src/core/utils/google-analytics'
import recipesData from 'src/data/recipes.json'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTagsService } from 'src/tags/TagsService'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const tabsetId = ref(null as unknown as string)
const tabset = ref<Tabset>(new Tabset(uid(), 'empty', []))

const route = useRoute()

onMounted(() => {
  Analytics.firePageViewEvent('IndexPage', document.location.href)
  tabsetId.value = route?.params.tabsetId as string
})

const search = ref('')
const selectedCategory = ref('')
const recipes = ref(recipesData)

const categories = ['Alle Rezepte', ...new Set(recipes.value.map((r) => r.category))]

type TabAndReference = { tab: Tab; trf: object }
type TabAndReferences = { tab: Tab; trfs: TabReference[] }

watchEffect(() => {
  tabset.value = useTabsetsStore().getTabset(tabsetId.value) || new Tabset(uid(), 'empty', [])
  tabset.value.tabs = useTagsService()
    .getTabsWithClassification('bibbly:recipe')
    .map((iT: IndexedTab) => {
      return iT.tab
    })
  console.log('mounted2', tabset.value.tabs.length)
})

const filteredRecipes = computed(() => {
  const allRecipies: Rezept[] = []

  console.log('input', tabset.value.tabs.length)
  const rs: TabAndReference[] = tabset.value.tabs
    .flatMap((t: Tab) => {
      const tRs: TabReference[] = t.tabReferences.filter(
        (tr: TabReference) => tr.type === TabReferenceType.LINKING_DATA && useLdJsonUtils().typeIs(tr.data, 'Recipe'),
      )
      return { tab: t, trfs: tRs }
    })
    .flatMap((tabAndReferences: TabAndReferences) => {
      const res: TabAndReference[] = tabAndReferences.trfs.map((tr: TabReference) => {
        return { tab: tabAndReferences.tab, trf: tr.data }
      })
      return res
    })
  //.map((tr: TabReference) => tr.data)
  // console.log('rs', rs)

  rs.forEach((r2: TabAndReference) => {
    allRecipies.push(useRecipesServices().extractFrom(r2))
  })

  return allRecipies.filter(
    (r) =>
      r.title.toLowerCase().includes(search.value.toLowerCase()) &&
      (selectedCategory.value === 'Alle Rezepte' ||
        selectedCategory.value === '' ||
        r.category === selectedCategory.value),
  )
})
</script>
<style lang="scss" scoped>
//.badge-green {
//  border: 1px solid;
//  border-color: $aspargus;
//  color: $aspargus;
//}
//
//.badge-green.active {
//  background-color: $aspargus;
//  color: white;
//}
</style>
