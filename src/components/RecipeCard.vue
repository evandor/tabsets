<template>
  <!-- Karte: klickbar auf Mobile -->
  <q-card class="full-width recipe-card" :class="{ 'cursor-pointer': isMobile }" @click="isMobile && goToDetail()">
    <!-- Rezeptbild -->
    <q-img :src="recipe.image" style="height: 200px; width: 100%;" ratio="16/9" class="recipe-img">
      <!-- Share-Button oben rechts -->
      <q-btn round dense flat icon="clear" class="absolute-top-right q-ma-sm midnight-green"
        style="background-color: rgba(255, 255, 255, 0.7);" size="sm" @click.stop="deleteRecipe"
        :aria-label="`Rezept löschen: ${recipe.title}`" />
    </q-img>

    <!-- Titel & Kategorie -->
    <q-card-section>
      <div class="text-h6 midnight-green">{{ recipe.title }}</div>
      <div class="text-subtitle2 text-grey-7">{{ recipe.category }}</div>
      <div v-if="recipe.source" class="text-caption">
        <a :href="recipe.source" target="_blank" rel="noopener" class="text-8 source-link">
          {{ recipe.domain }}
        </a>
      </div>
    </q-card-section>

    <!-- Optional: Aktionen -->
    <q-card-actions align="around">
      <div class="row items-center q-gutter-sm">
        <q-icon name="schedule" color="grey-7" size="16px" />
        <span class="text-caption text-grey-7">{{ recipe.prepTime + recipe.cookTime }} min</span>
      </div>
      <div>
        <q-btn padding="xs lg" v-if="!isMobile" flat rounded class="card-show-button" @click.stop="goToDetail">
          Anzeigen
        </q-btn>
      </div>
    </q-card-actions>

  </q-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'



const $q = useQuasar()
const router = useRouter()
const isMobile = $q.screen.lt.md


const props = defineProps<{
  recipe: {
    id: string
    title: string
    category: string
    instructions: string[]
    prepTime: number
    cookTime: number
    portions: number
    image: string
    source?: string
    domain: string
  }
}>()



function goToDetail() {
  router.push({ name: 'recipe-detail', params: { id: props.recipe.id } }).catch(err => {
    console.error('Navigation fehlgeschlagen:', err)
  })
}

function deleteRecipe() {
  alert(`Löschen: ${props.recipe.title}`)
}


</script>

<style scoped>
.recipe-card {
  width: 100%;
  display: inline-block;
  vertical-align: top;
}

.recipe-img {
  border-bottom: 1px solid #ddd;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
