<template>
  <div class="row q-py-xs darkColors lightColors" v-if="messages.length > 0">
    <div class="col-10">
      <q-icon name="o_email" class="q-pr-sm q-mb-sm" />
      Messages
      <q-badge color="orange">{{ messageCount }}</q-badge>
      <span v-if="messageCount > 1" class="cursor-pointer text-body2 q-ml-md" @click="clearMessages()"
        >[delete {{ messageCount > messages.length ? 'all shown' : 'all' }}]</span
      >
    </div>
    <div class="col-2 text-right">
      <!--      <q-icon v-if="showDetails" name="o_delete" color="negative" class="cursor-pointer" @click="clearMessages()" />-->

      <q-icon
        class="cursor-pointer"
        :name="showDetails ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="toggleShowDetails()" />
    </div>
    <div class="column fit" v-if="showDetails">
      <div class="col text-body2 ellipsis" v-for="m in messages">
        <div class="row">
          <div class="col-8 ellipsis" :class="m.actionPath ? 'cursor-pointer' : ''" @click.stop="handleActionPath(m)">
            {{ m['message' as keyof object] }}
            <q-tooltip class="tooltip-small">{{ m.id }} {{ m.actionPath }}</q-tooltip>
          </div>
          <div class="col-4 text-right ellipsis" style="font-size: smaller">
            {{ formatDate(m.created) }}
            <q-icon name="o_delete" class="cursor-pointer" @click="deleteMessage(m)"></q-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatDistance } from 'date-fns'
import { useQuasar } from 'quasar'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useMessagesStore } from 'src/messages/stores/messagesStore'
import useSidePanelMessagesMarkupView from 'src/tabsets/components/helper/sidePanelMessagesMarkupView'
import DeleteBookmarksByUrlDialog from 'src/tabsets/components/messageDialogs/DeleteBookmarksByUrlDialog.vue'
import { Message } from 'src/tabsets/models/Message'
import { MonitoredTab } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'

const $q = useQuasar()

const messages = ref<Message[]>([])
const showDetails = ref(true)
const messageCount = ref(0)

const { clearMessage } = useSidePanelMessagesMarkupView()

watchEffect(() => {
  const msgs = useMessagesStore().getUnreadMessages
  messages.value = msgs.slice(0, 20)
  messageCount.value = msgs.length
})

const toggleShowDetails = () => (showDetails.value = !showDetails.value)

const clearMessages = async () => {
  for (const m of messages.value) {
    await clearMessage(m.id)
  }
}

const deleteMessage = async (m: Message) => {
  await clearMessage(m.id)
}

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''

const handleActionPath = (m: Message) => {
  if (m.actionPath) {
    if (m.actionPath.startsWith('dialog://deleteTabs/')) {
      const params = m.actionPath.split('/deleteTabs/')[1]!
      const paramsSplit = params.split('/')
      const url = atob(paramsSplit[0]!)
      const bmCount = Number(paramsSplit[1]!)
      console.log('url', url)
      $q.dialog({
        component: DeleteBookmarksByUrlDialog,
        componentProps: {
          url,
          bmCount,
        },
      })
        .onOk(() => {
          useMessagesStore().deleteMessage(m.id)
        })
        .onCancel(() => {
          useMessagesStore().deleteMessage(m.id)
        })
    } else if (m.actionPath.startsWith('tab://')) {
      $q.dialog({
        title: "Tab's content changed",
        message: 'Open tab',
      }).onOk(() => {
        const params = m.actionPath!.split('tab://')
        const tabId = params[1]
        if (tabId) {
          const tabAndTsId = useTabsetsStore().getTabAndTabsetId(tabId)
          if (tabAndTsId && tabAndTsId.tab.url) {
            useNavigationService().browserTabFor(tabAndTsId.tab.url)
            const ts = useTabsetsStore().getTabset(tabAndTsId.tabsetId)
            if (ts) {
              ts.monitoredTabs.forEach((tm: MonitoredTab) => {
                if (tm.tabId === tabAndTsId.tab.id) {
                  delete tm.changed
                }
              })
            }
          }
        }
      })
    } else {
      console.warn('unknown action path ', m)
    }
  }
}
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
