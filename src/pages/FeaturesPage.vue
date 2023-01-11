<template>

  <!-- toolbar -->
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-5">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div class="col-1"><span class="text-dark">{{ feature }}</span> <span
              class="text-primary">
            </span></div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right">


      </div>
    </div>
  </q-toolbar>

  <div class="row q-ma-lg">

    <div class="col-12">
      <div class="text-h6">Optional Feature 'bookmarks'</div>
    </div>
    <div class="col-12">
      <div>Status: {{ hasFeature('bookmarks')}}</div>
    </div>

    <div class="col-12 q-my-md">
      <div>Description</div>
    </div>

    <div class="col-12 q-my-md">
      <div>The Bookmarks Feature lets you access the browsers bookmarks to view (or delete) them and to turn them
      into tabsets if you wish.</div>
    </div>

    <div class="col-12 q-my-md">
      <div>Permissions needed</div>
    </div>

    <div class="col-12 q-my-md">
      <div>This feature needs additional permissions.</div>
    </div>

    <div class="col-12 q-my-md">
      <div>Action</div>
    </div>

    <div class="col-12 q-my-md">
      <q-btn v-if="!hasFeature('bookmarks')"
             label="Activate Bookmarks Feature" @click="grant('bookmarks')" />
      <q-btn v-else
        label="Deactivate Bookmarks Feature" @click="revoke('bookmarks')" />
    </div>

  </div>

</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue'
import {useRoute, useRouter} from "vue-router";
import {useQuasar} from "quasar";
import TabColumns from "src/components/layouts/TabColumns.vue";
import TabsCanvas from "src/components/layouts/TabsCanvas.vue";
import _ from "lodash"
import {useTabsStore} from "src/stores/tabsStore";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {Tab} from "src/models/Tab";
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {Tabset, TabsetStatus} from "src/models/Tabset";
import TabList from "components/layouts/TabList.vue";
import {usePermissionsStore} from "stores/permissionsStore";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {GrantPermissionCommand} from "src/domain/commands/GrantPermissionCommand";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {RevokePermissionCommand} from "src/domain/commands/RevokePermissionCommand";

const route = useRoute();
const router = useRouter();
const localStorage = useQuasar().localStorage
const tabsStore = useTabsStore()
const tabGroupsStore = useTabGroupsStore()
const featuresStore = useFeatureTogglesStore()
const permissionsStore = usePermissionsStore()

const tabsetname = ref(tabsStore.currentTabsetName)
const filter = ref('')
const $q = useQuasar()

const highlightUrl = ref('')

const feature = ref(null as unknown as string)

watchEffect(() => {
  feature.value = route.params.feature as string
})

const hasFeature = (feature: string) => permissionsStore.hasFeature(feature)

const grant = (ident: string) => useCommandExecutor()
  .executeFromUi(new GrantPermissionCommand(ident))
  // .then((res: ExecutionResult<boolean>) => bookmarksPermissionGranted.value = res.result)
  //.then((res: ExecutionResult<boolean>) => bookmarksPermissionGranted.value = res.result)
const revoke = (ident: string) => useCommandExecutor()
  .executeFromUi(new RevokePermissionCommand(ident))


</script>

