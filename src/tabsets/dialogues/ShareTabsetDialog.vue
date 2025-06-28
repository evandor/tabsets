<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div v-if="props.republish" class="text-h6">Republish Tabset</div>
        <div v-else class="text-h6">Share Tabset...</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          Would you like to {{ props.republish ? 're-share' : 'share' }} this tabset: {{ props.tabsetName }}?
        </div>
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          Author:
          <help-widget>The Invitee will see this name to know who invited her</help-widget>
        </div>
        <q-input
          v-model="author"
          class="q-mb-md q-pb-none"
          dense
          autofocus
          type="text"
          error-message="Please do not use special Characters, maximum length is 32" />
      </q-card-section>
      <q-card-section>
        <div class="text-body">
          User to share with:
          <help-widget>Provide an email this invitation is sent to</help-widget>
        </div>
        <q-input
          v-model="shareWithEmail"
          class="q-mb-md q-pb-none"
          dense
          autofocus
          type="email"
          error-message="Please provide a valid email address" />
        <q-checkbox v-model="readonly" label="readonly" />
      </q-card-section>
      <q-card-section v-if="pendingInvitations.length > 0">
        <div class="text-body">Pending Invitations:</div>
        <div v-for="invitation in pendingInvitations">
          <span class="cursor-pointer" @click="pickEmail(invitation['email' as keyof object])">{{
            invitation['email' as keyof object]
          }}</span>
        </div>
      </q-card-section>
      <q-card-section v-if="activeInvitations.length > 0">
        <div class="text-body">Active Share:</div>
        <div v-for="invitation in activeInvitations">
          <span class="cursor-pointer">{{ invitation['email' as keyof object] }}</span>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="text-primary">
        <q-btn size="md" color="accent" label="Cancel" @click="onDialogCancel" />
        <q-btn
          size="md"
          color="warning"
          :disable="
            !author || activeInvitations.map((i) => i['email' as keyof object] as string).indexOf(shareWithEmail) >= 0
          "
          :label="okLabel()"
          v-close-popup
          @click="shareTabset()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { LocalStorage, useDialogPluginComponent, useQuasar } from 'quasar'
import { SHARING_AUTHOR_IDENT } from 'src/boot/constants'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { ShareWithTabsetCommand } from 'src/tabsets/commands/ShareWithTabsetCommand'
import { ref } from 'vue'

defineEmits([...useDialogPluginComponent.emits])

const $q = useQuasar()

const props = defineProps({
  tabsetId: { type: String, required: true },
  tabsetName: { type: String, required: true },
  sharedId: { type: String, required: false },
  republish: { type: Boolean, required: false },
})

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const author = ref<string>(LocalStorage.getItem(SHARING_AUTHOR_IDENT) || '')
const readonly = ref(false)
const shareWithEmail = ref<string>('')
const activeInvitations = ref<object[]>([])
const pendingInvitations = ref<object[]>([])

const shareTabset = () => {
  $q.localStorage.set(SHARING_AUTHOR_IDENT, author.value)
  useCommandExecutor()
    .executeFromUi(
      new ShareWithTabsetCommand(props.tabsetId, author.value, shareWithEmail.value, readonly.value, props.republish),
    )
    .then((res: any) => {
      //useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
    })
}

const pickEmail = (email: string) => (shareWithEmail.value = email)

const okLabel = () => {
  const def = props.republish ? 'Republish Tabset' : 'Share Tabset'
  if (
    pendingInvitations.value.map((o: object) => o['email' as keyof object] as string).indexOf(shareWithEmail.value) >= 0
  ) {
    return 'Resend Invitation'
  }
  return def
}
</script>
