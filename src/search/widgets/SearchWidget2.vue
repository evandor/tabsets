<template>
  <q-input
    type="search"
    ref="searchInputRef"
    :placeholder="searchBoxFocused ? 'Filter (for search press enter)' : ''"
    class="darkInDarkMode brightInBrightMode q-mx-sm q-mt-xs q-mb-none text-caption k-mini-input"
    @keyup.enter="emits('onEnter')"
    @focus="searchBoxFocused = true"
    @blur="searchBoxFocused = false"
    v-model="search">
    <template v-slot:prepend>
      <q-icon name="search" size="sm" color="grey-5" />
    </template>
    <template v-slot:append>
      <span class="text-caption" v-if="searchBoxFocused">
        <!--        {{ searchKeyboardShortcut }}-->
        <!--        <template v-if="props.filteredFoldersCount">-->
        <!--          {{ hitsAndFoldersCount }}<q-icon name="o_folder" size="xs" color="warning" class="q-ml-none q-mb-xs" />-->
        <!--        </template>-->
        <!--        {{ hitsAndEntriesCount }}<q-icon name="o_tab" size="xs" color="primary" class="q-ml-xs q-mb-xs" />-->
        <q-icon
          v-if="search && search.trim().length > 0"
          name="o_backspace"
          size="xs"
          color="grey"
          class="q-ml-xs q-mb-xs cursor-pointer"
          @click="clearSearch()">
          <q-tooltip class="tooltip-small">Clear Input</q-tooltip>
        </q-icon>
        <q-icon
          name="o_cancel"
          size="xs"
          color="grey"
          class="q-ml-xs q-mb-xs cursor-pointer"
          @click="useUiStore().setQuickAccess('search', false)">
          <q-tooltip class="tooltip-small">Hide Search Box</q-tooltip>
        </q-icon>
      </span>
    </template>
  </q-input>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { useSearchStore } from 'src/search/stores/searchStore'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'

type Props = {
  searchTerm: string
  filteredTabsCount?: number
  filteredFoldersCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  searchTerm: '',
  filteredTabsCount: 0,
})

const emits = defineEmits(['onEnter', 'onTermChanged'])

const $q = useQuasar()

const searchStore = useSearchStore()
const search = ref(props.searchTerm)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchKeyboardShortcut = ref<string | undefined>(undefined)
const currentTabset = ref<Tabset | undefined>(undefined)
const hitsAndFoldersCount = ref('2')
const hitsAndEntriesCount = ref('')
const searchBoxFocused = ref(false)

onMounted(() => {
  setTimeout(() => {
    if (searchInputRef.value) {
      searchInputRef.value?.focus()
    }
  }, 500)
})

watchEffect(() => {
  searchStore.term = search.value
  emits('onTermChanged', { term: search.value })
  hitsAndEntriesCount.value = search.value ? `${props.filteredTabsCount}` : `${currentTabset.value?.tabs.length}`
  hitsAndFoldersCount.value = search.value ? `${props.filteredFoldersCount}` : `${currentTabset.value?.folders.length}`
})

try {
  chrome.commands.getAll().then((cs: chrome.commands.Command[]) => {
    const searchCommand = cs.filter((c: chrome.commands.Command) => c.name === 'search').shift()
    if (searchCommand) {
      searchKeyboardShortcut.value = searchCommand.shortcut
    }
  })
} catch (error) {
  console.debug("can't check for newtab extension", error)
}

if ($q.platform.is.chrome && $q.platform.is.bex) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'search') {
      console.debug(`got Command: ${command}`)
      searchInputRef.value!.focus()
    }
  })
}

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

const clearSearch = () => {
  search.value = ''
}
</script>

<!-- https://stackoverflow.com/questions/78573433/quasar-how-i-can-change-the-height-of-q-select -->
<style>
.k-mini-input .q-field__control,
.k-mini-input .q-field__inner,
.k-mini-input .q-field__marginal,
.k-mini-input .q-field__control input {
  height: 28px !important;
  min-height: 28px !important;
}

.k-mini-input .q-field__control,
.k-mini-input .q-field__native {
  padding: 0 4px;
}

.k-mini-input .q-field__inner {
  min-height: 28px;
}

.k-mini-input .q-field__native {
  min-height: 28px !important;
}
</style>
