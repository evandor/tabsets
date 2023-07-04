<template>
  <div class="q-ma-none q-pa-md fullimageBackground">
    <div class="row">
      <div class="col-12 text-h6">
        Welcome to Tabsets Extension
      </div>
    </div>
    <div class="row q-mb-lg">
      <div class="col-12 text-subtitle1">
        <i>Bookmarks next generation</i>
      </div>
    </div>

    <div class="row items-center">
      <div class="col-12 text-subtitle2 q-mb-md">
        To get started:
      </div>
    </div>

    <q-btn class="text-primary"
           outline
           :disable="categorySelected() && !confirmation"
           data-testid="createFirstTabsetBtn"
           @click="addFirstTabset"
           label="create your first tabset"></q-btn>

    <div class="row q-mt-lg">
      <div class="col-12 items-center q-mb-md">
        This will create a new tabset to which you can add tabs to
      </div>
    </div>

    <div class="row q-mt-lg" v-if="$q.screen.gt.sm">
      <div class="col-12 items-center q-ma-sm q-pa-lg bg-yellow-4"
           style="border:1px solid grey;border-radius: 3px;">
        If you are using a recent version of chrome and this opened in the main window (not in the
        sidepanel), please try opening it again.
      </div>
    </div>

    <div class="row q-mt-sm" v-if="categories.size > 0">
      If you want, you can opt in and get suggestions for the following
      categories:
    </div>

    <div class="row" v-for="c in categories.values()">
      <q-checkbox class="q-ma-none q-pa-none" v-model="selectedCategories[c.id]" :label="c.label"/>
    </div>

    <div class="row q-mt-lg" v-if="categorySelected()">
      <div class="col-12 items-center q-ma-xs q-pa-xs">
        <q-checkbox v-model="confirmation">
          <a @click.stop="(event) => event.stopPropagation()" href="https://tabsets.web.app/#/tos"> Confirm to terms &
            conditions </a>
        </q-checkbox>
        <br>
        <span class="text-caption text-grey-8">
          Tabs you add will be sent anonymously to our servers to improve the categories we
          provide for all users.
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useUiStore} from "src/stores/uiStore";
import {useQuasar} from "quasar";
import {useCategoriesStore} from "stores/categoriesStore";
import {onMounted, ref, watchEffect} from "vue";
import {Category} from "src/models/Category";
import {ca} from "date-fns/locale";
import {useDB} from "src/services/usePersistenceService";

const $q = useQuasar()

const categoriesStore = useCategoriesStore()

onMounted(() => categoriesStore.initialize(useDB(undefined).db))

const categories: Map<String, Category> = new Map()

const selectedCategories = ref<object>({
  "business": false,
  "education": false,
  "entertainment": false,
  "informationtech": false,
  "newandmedia": false,
  "shopping": false
})
const confirmation = ref(false)

categories.set("business", new Category("business", "Business"))
categories.set("education", new Category("education", "Education"))
categories.set("entertainment", new Category("entertainment", "Entertainment"))
categories.set("informationtech", new Category("informationtech", "Information / Tech"))
categories.set("newandmedia", new Category("newandmedia", "News & Media"))
categories.set("shopping", new Category("shopping", "Shopping"))

const addFirstTabset = () => $q.dialog({
  component: NewTabsetDialog, componentProps: {
    setEmptyByDefault: useUiStore().newTabsetEmptyByDefault,
    firstTabset: true,
    selectedCategories: selectedCategories.value,
    fromPanel: true
  }
})

const categorySelected = (): boolean => {
  let res = false
  Object.keys(selectedCategories.value).forEach(sc => {
    console.log("checking", selectedCategories.value[sc as keyof object])
    if (selectedCategories.value[sc as keyof object] === true) {
      res = true
    }
  })
  return res
}

</script>

<style scoped>


.fullimageBackground {
  height: 100vh;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.fullimageBackground::before {
  background-image: url('src/assets/bg.jpg');
  background-size: cover;
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.3;
}

</style>
