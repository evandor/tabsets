<template>
  <div class="q-pa-md q-gutter-sm">
    <div class="text-h6">Permissions</div>

    <q-banner rounded>The active permissions for the Tabset Extension</q-banner>

    <div class="row items-baseline q-ma-md">
      <div class="col-3">Active Permissions</div>
      <div class="col-9">
        {{ permissionsList.join(', ') }}
      </div>
    </div>

    <div class="row items-baseline q-ma-md">
      <div class="col-3">Allowed Origins</div>
      <div class="col-9">
        {{ usePermissionsStore().permissions?.origins }} <q-btn label="Add All URLs" @click="addAllOrigins()" />
      </div>
    </div>

    <div class="text-h6">Groups</div>

    <q-banner rounded>All Chrome Groups, active and non-active</q-banner>

    <div class="row items-baseline q-ma-md">
      <div class="col-3">All Groups</div>
      <div class="col-9">
        {{ useGroupsStore().tabGroups }}
      </div>
    </div>

    <q-banner rounded>All active Chrome Groups</q-banner>

    <div class="row items-baseline q-ma-md">
      <div class="col-3">Active Groups</div>
      <div class="col-9">
        {{ useGroupsStore().currentTabGroups }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { usePermissionsStore } from 'src/core/stores/usePermissionsStore'
import { useGroupsStore } from 'src/tabsets/stores/groupsStore'
import { ref, watchEffect } from 'vue'

const permissionsList = ref<string[]>([])
watchEffect(() => (permissionsList.value = usePermissionsStore().permissions?.permissions || []))

const addAllOrigins = async () => {
  const response = await chrome.permissions.request({ origins: ['<all_urls>'] })
  console.log('response', response)
}
</script>
