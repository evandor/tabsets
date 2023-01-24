<template>
  <div>
    <div class="row items-baseline q-mx-md q-pa-none" style="width:265px;border-top:1px dotted grey">
      <div class="col-12 q-ma-none">
        <q-banner v-if="tabset.type === TabsetType.SESSION" rounded class="bg-amber-1 text-black">
          This tabset is a 'Session'
        </q-banner>
      </div>
    </div>

    <div class="row items-baseline q-mx-md q-my-none" style="width:265px">

      <div class="col-12 text-body1">
        Tabset
      </div>
      <div class="col-12 text-body2 ellipsis">
        {{ tabset.name }}
      </div>
      <div class="col-12 text-caption">
        created {{ formatDate(tabset.created) }}
        <q-tooltip>
          {{ date.formatDate(tabset.created, 'DD.MM.YYYY HH:mm') }}
        </q-tooltip>
      </div>
      <div class="col-12 text-caption">
        updated {{ formatDate(tabset.updated) }}
        <q-tooltip>
          {{ date.formatDate(tabset.updated, 'DD.MM.YYYY HH:mm') }}
        </q-tooltip>
      </div>
      <div class="col-12 text-body2 ellipsis">
        &nbsp;
        <!--        tabs: Tab[]-->
        <!--        groups: Group[]-->
        <!--        spaces: string[] // got json problems with set<string>-->
        <!--        view: string = 'grid'-->
        <!--        status: TabsetStatus = TabsetStatus.DEFAULT-->
        <!--        type: TabsetType = TabsetType.DEFAULT-->
      </div>

      <div class="col-12">
        <div class="text-overline ellipsis">

        </div>
      </div>

      <div class="row q-mx-md q-my-none" style="width:265px;border:0 solid yellow">

        <div class="col-3 text-left">
          <!--          <q-btn round size="11px"-->
          <!--                 color="primary"-->
          <!--                 flat-->
          <!--                 icon="o_info">-->

          <!--          </q-btn>-->


        </div>
        <div class="col-9 text-right">
          <!--          <q-btn round size="11px"-->
          <!--                 color="warning"-->
          <!--                 flat-->
          <!--                 icon="edit_note"-->
          <!--                >-->
          <!--            <q-tooltip>Add a note to this tab or edit it</q-tooltip>-->
          <!--          </q-btn>-->

          <!--          <q-btn flat round color="primary" size="11px" icon="o_schedule" @click.stop="scheduleTab()">-->

          <!--          </q-btn>-->

          <!--          <q-btn flat round color="primary" size="11px" icon="save" @click.stop="saveTab(notificationStore.selectedTab)">-->

          <!--          </q-btn>-->

          <q-icon v-if="!inBexMode()"
                  name="o_share" class="q-mr-lg cursor-pointer" color="positive" size="18px"
                  @click="shareDialog(tabset)">
            <q-tooltip>Share this tabset...</q-tooltip>
          </q-icon>

          <q-icon name="delete_outline" class="cursor-pointer" color="negative" size="18px"
                  @click="deleteDialog(tabset)">
            <q-tooltip>Delete this tabset...</q-tooltip>
          </q-icon>

        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import {useQuasar} from "quasar";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {ref, watchEffect} from "vue";
import {date} from "quasar"
import {useFeatureTogglesStore} from "src/stores/featureTogglesStore";
import {useRouter} from "vue-router";

import {useTabsetService} from "src/services/TabsetService2";
import {useTabsStore} from "src/stores/tabsStore";
import {Tabset, TabsetType} from "src/models/Tabset";
import {useUtils} from "src/services/Utils";
import DeleteTabsetDialog from "components/dialogues/DeleteTabsetDialog.vue";

const tabsStore = useTabsStore()
const notificationStore = useNotificationsStore()
const featuresStore = useFeatureTogglesStore()
const router = useRouter()
const $q = useQuasar()

const {formatDate, inBexMode} = useUtils()

const tabset = ref<Tabset | undefined>(undefined)
const content = ref('')
const {selectTabset} = useTabsetService()

watchEffect(() => tabset.value = tabsStore.getCurrentTabset)

const deleteDialog = (tabset: Tabset) =>
  $q.dialog({
    component: DeleteTabsetDialog,
    componentProps: {
      tabsetId: tabset.id,
      tabsetName: tabset.name
    }
  })

</script>
