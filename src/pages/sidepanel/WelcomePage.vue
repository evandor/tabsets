<template>
  <div class="q-ma-none q-pa-md fullimageBackground">
    <div class="row">
      <div class="col-12 text-h6">
        Welcome to Tabsets Extension
      </div>
    </div>
    <div class="row q-mb-lg">
      <div class="col-12">
        Next Generation Bookmarks
      </div>
    </div>

    <div class="row items-center justify-center q-ma-xl">
      <q-btn color="warning"
             :disable="categorySelected() && !confirmation"
             data-testid="createFirstTabsetBtn"
             @click="addFirstTabset"
             label="Create your first Tabset"></q-btn>
    </div>

<!--    <div class="row q-mb-md" v-if="categories.size > 0">-->
<!--      If you want, you can opt in and get suggestions for the following-->
<!--      categories:-->
<!--    </div>-->

<!--    <div class="row" v-for="c in categories.values()">-->
<!--      <q-checkbox class="q-ma-none q-pa-none" v-model="selectedCategories[c.id]" :label="c.label"/>-->
<!--    </div>-->

<!--    <div class="row q-mt-lg" v-if="categorySelected()">-->
<!--      <div class="col-12 items-center q-ma-xs q-pa-xs">-->
<!--        <q-checkbox v-model="confirmation">-->
<!--          <a @click.stop="(event) => event.stopPropagation()" href="https://tabsets.web.app/#/tos"> Confirm to terms &-->
<!--            conditions </a>-->
<!--        </q-checkbox>-->
<!--        <br>-->
<!--        <span class="text-grey-8">-->
<!--          Tabs you add will be sent anonymously to our servers to improve the categories we-->
<!--          provide for all users.-->
<!--        </span>-->
<!--      </div>-->
<!--    </div>-->
  </div>
</template>

<script lang="ts" setup>

import NewTabsetDialog from "components/dialogues/NewTabsetDialog.vue";
import {useUiStore} from "src/stores/uiStore";
import {useQuasar} from "quasar";
import {ref, watchEffect} from "vue";
import {Category} from "src/models/Category";
import {useTabsStore} from "stores/tabsStore";
import {useRouter} from "vue-router";

const $q = useQuasar()
const router = useRouter()

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

watchEffect(() => {
  // we might have been redirected here too early, redirecting
  // back as soon we know we actually do have some tabsets
  if (useTabsStore().tabsets.size > 0) {
    router.back()
  }
})

const addFirstTabset = () => $q.dialog({
  component: NewTabsetDialog, componentProps: {
    setEmptyByDefault: useUiStore().newTabsetEmptyByDefault,
    firstTabset: true,
    //selectedCategories: selectedCategories.value,
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
