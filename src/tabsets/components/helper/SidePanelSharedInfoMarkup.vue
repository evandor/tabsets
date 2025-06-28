<template>
  <div
    class="row q-py-xs darkColors lightColors"
    v-if="
      tabset &&
      tabset.sharing &&
      (tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK ||
        tabset.sharing.sharing === TabsetSharing.PUBLIC_LINK_OUTDATED)
    ">
    <div class="col-10">
      <q-icon name="public" color="warning" class="q-pr-sm q-ml-sm" />
      <span class="text-body2 font-bold">This tabset is shared publicly</span>
    </div>
    <div class="col text-right q-mr-sm">
      <q-icon name="more_vert" class="cursor-pointer"></q-icon>
      <q-menu anchor="top right" self="bottom right">
        <ShareTabsetActionSecondLevelMenu :tabset="tabset" />
      </q-menu>
    </div>
  </div>
  <div
    class="row q-py-xs darkColors lightColors"
    v-if="tabset && tabset.sharing && tabset.sharing.sharing === TabsetSharing.USER">
    <div class="col-10 ellipsis">
      <q-icon name="public" color="warning" class="q-pr-sm q-ml-sm" />
      <span class="text-body2 font-bold" v-if="tabset.sharing.sharedBy === useAuthStore().user.email"
        >Tabset Shared by you</span
      >
      <span v-else>Shared with you by {{ tabset.sharing.sharedBy }}</span>
    </div>
    <div class="col text-right q-mr-sm">
      <q-icon name="more_vert" class="cursor-pointer"></q-icon>
      <q-menu anchor="top right" self="bottom right">
        <ShareTabsetActionSecondLevelMenu :tabset="tabset" />
      </q-menu>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import ShareTabsetActionSecondLevelMenu from 'src/tabsets/actions/ShareTabsetActionSecondLevelMenu.vue'
import useSidePanelMessagesMarkupView from 'src/tabsets/components/helper/sidePanelMessagesMarkupView'
import { Tabset, TabsetSharing } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useAuthStore } from 'stores/authStore'
import { ref, watchEffect } from 'vue'

const $q = useQuasar()

const tabset = ref<Tabset | undefined>(undefined)
const showDetails = ref(true)
const messageCount = ref(0)

const { clearMessage } = useSidePanelMessagesMarkupView()

watchEffect(() => {
  tabset.value = useTabsetsStore().getCurrentTabset
})

const toggleShowDetails = () => (showDetails.value = !showDetails.value)
</script>

<style scoped lang="scss">
.body--dark .darkColors {
  background-color: $grey-8;
  border: 1px solid $grey-7;
}

.body--light .lightColors {
  background-color: $grey-1;
  border: 1px solid $grey-2;
}
</style>
