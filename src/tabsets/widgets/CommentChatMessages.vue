<template>
  <q-chat-message
    v-for="m in props.comments"
    :name="m.author"
    @click="selectComment(m.id)"
    :avatar="'http://www.gravatar.com/avatar/' + sha256(m.authorEmail?.trim().toLowerCase() || '')"
    :text="[m.comment]"
    :size="$q.screen.lt.md ? '11' : '6'"
    :sent="isSender(m)"
    :bg-color="m.id === selectedCommentId ? 'warning' : isSender(m) ? 'blue' : 'grey-2'"
    :text-color="isSender(m) ? 'white' : 'black'">
    <template v-slot:stamp>{{ m.edited ? 'Edited' : '' }} {{ formatDate(m.date) }}</template>
    <template v-slot:name>
      <div v-if="m.id === selectedCommentId && m.authorEmail === useAuthStore().user.email">
        <span @click.stop="editSelectedComment(m)" class="q-mr-sm">[edit]</span>
        <span @click.stop="deleteSelectedComment()">[delete]</span>
      </div>
      <div v-else>
        <!--        <div class="q-mt-sm" v-if="newCommentIds.findIndex((id: string) => id === m.id) >= 0">-->
        <!--          new messages-->
        <!--          <hr />-->
        <!--        </div>-->
        {{ m.authorEmail === useAuthStore().user.email ? 'me' : m.authorEmail }}
      </div>
    </template>
  </q-chat-message>
</template>

<script lang="ts" setup>
import { formatDistance } from 'date-fns'
import { sha256 } from 'js-sha256'
import { useQuasar } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useEventsServices } from 'src/events/services/EventsServices'
import { useAuthStore } from 'src/stores/authStore'
import { DeleteCommentCommand } from 'src/tabsets/commands/DeleteCommentCommand'
import CommentDialog from 'src/tabsets/dialogues/CommentDialog.vue'
import { Tab, TabComment } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref } from 'vue'

const $q = useQuasar()

const props = defineProps<{
  comments: TabComment[]
  tab: Tab
  tabsetId: string | undefined
}>()

const selectedCommentId = ref<string | undefined>(undefined)

const selectComment = (commentId: string) => {
  selectedCommentId.value = commentId
  console.log('props.tabset', props.tabsetId)
  if (props.tabsetId) {
    useEventsServices().removeTabsetEvent(props.tabsetId, 'tabcomment-added', commentId)
  }
}

const deleteSelectedComment = () => {
  if (selectedCommentId.value) {
    useCommandExecutor().executeFromUi(new DeleteCommentCommand(props.tab.id, selectedCommentId.value))
    selectedCommentId.value = undefined
  }
}

const editSelectedComment = (m: TabComment) => {
  if (selectedCommentId.value) {
    const tabset = useTabsetsStore().getTabset(props.tabsetId!)
    $q.dialog({
      component: CommentDialog,
      componentProps: { tabId: props.tab.id, sharedId: tabset!.sharing?.sharedId, comment: m },
    })
  }
}

const isSender = (comment: TabComment) => comment.authorEmail === useAuthStore().user.email

const formatDate = (timestamp: number | undefined) =>
  timestamp ? formatDistance(timestamp, new Date(), { addSuffix: true }) : ''
</script>
