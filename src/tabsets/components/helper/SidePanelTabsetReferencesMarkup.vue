<template>
  <template v-if="tabset?.sharing?.shareReference">
    <div class="row q-py-xs darkColors lightColors">
      <div class="col-11">
        <q-icon name="ios_share" size="xs" class="q-pr-xs q-mb-xs" />
        Shared Collection
      </div>
      <div class="col-1">
        <q-icon
          class="cursor-pointer"
          :name="showDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
          @click="toggleShowDetails()" />
      </div>
    </div>
    <div v-if="showDetails" class="col-12 text-body2 ellipsis">Collection shared by {{ sharedBy }}</div>
  </template>
  <template v-else-if="shared.length > 0">
    <div class="row q-py-xs darkColors lightColors">
      <div class="col-11">
        <q-icon name="ios_share" size="xs" class="q-pr-xs q-mb-xs" />
        This collection is being shared {{ showDetails ? 'with' : '' }}
      </div>
      <div class="col-1">
        <q-icon
          class="cursor-pointer"
          :name="showDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
          @click="toggleShowDetails()" />
      </div>
      <!--      <div v-if="showDetails" class="col-12 text-body2 ellipsis">Collection shared with {{ sharedWith }}:</div>-->
      <template v-if="showDetails" v-for="share in shared">
        <div class="col-11 q-pl-sm text-body2 ellipse">
          {{ share['email' as keyof object] }} ({{ share['status' as keyof object] }})
        </div>
        <div class="col-1 text-body2">
          <q-icon
            name="sym_o_file_copy_off"
            color="negative"
            class="cursor-pointer"
            @click="removeShare(share['email' as keyof object])">
            <q-tooltip class="tooltip-small" anchor="top left" self="center middle"
              >Stop sharing this collection
            </q-tooltip>
          </q-icon>
        </div>
      </template>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'

const tabset = ref<Tabset | undefined>(undefined)
const sharedBy = ref<string>('')
const sharedWith = ref<string>('')
const showDetails = ref(true)
const shared = ref<object[]>([])
const currentTabsetId = ref<string | undefined>(undefined)

watchEffect(() => {
  useTabsetsStore()
    .getCurrentTabsetId()
    .then((tsId: string | undefined) => (currentTabsetId.value = tsId))
})

const updateSharedInfo = () => {
  // no op
}

watchEffect(() => {
  updateSharedInfo()
})

watchEffect(() => {
  if (useMessagesStore().getUnreadMessages.length > 0) {
    //console.debug('got msgs', msgs.length) // needed for side effect?
    // changing messages means potential updates of shared info
    updateSharedInfo()
  }
})

const removeShare = async (email: string) => {
  // no op
}

const toggleShowDetails = () => (showDetails.value = !showDetails.value)
</script>

<style scoped lang="scss">
.body--dark .darkColors {
  background-color: $grey-9;
  border: 1px solid $grey-8;
}

.body--light .lightColors {
  background-color: $grey-2;
  border: 1px solid $grey-3;
}
</style>
