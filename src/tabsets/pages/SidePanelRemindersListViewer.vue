<template>
  <!-- SidePanelRemindersListViewer -->
  <div class="q-pa-none">
    <q-list class="rounded-borders">
      <q-expansion-item
        v-if="groupedTabs"
        v-for="reminderDate in Object.keys(groupedTabs as object)"
        expand-separator
        default-opened
        :label="date.formatDate(Number(reminderDate), 'DD.MM.YYYY')"
        caption="Reminders">
        <q-card>
          <q-card-section>
            <div v-for="tab in (groupedTabs as object)[reminderDate as keyof object] as Tab[]">
              <q-item
                clickable
                v-ripple
                class="q-mt-xs q-mx-xs q-mb-none q-pr-none q-pl-sm q-pb-none q-pt-none darkColors lightColors"
                :key="'paneltablist_' + tab.id">
                <PanelTabListElementWidget :tab="tab" :hide-menu="true" :header="tab.reminderComment ?? ''">
                  <template v-slot:actionPart>
                    <q-item-section
                      class="q-ma-none q-pa-none"
                      :style="TabService.isCurrentTab(tab) ? 'border-right:3px solid #1565C0;border-radius:3px' : ''"
                      style="justify-content: start; width: 30px; max-width: 30px">
                      <span>
                        <q-icon name="more_vert" class="cursor-pointer q-mt-sm" color="black" size="20px" />
                        <q-menu :offset="[0, 0]" @click.stop="">
                          <q-list dense style="min-width: 200px">
                            <q-item clickable v-close-popup @click="clearReminder(tab)">
                              <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
                                <q-icon size="xs" name="o_alarm" color="accent" />
                              </q-item-section>
                              <q-item-section>Clear Reminder</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </span>
                    </q-item-section>
                  </template>
                </PanelTabListElementWidget>
              </q-item>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import { date } from 'quasar'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import Analytics from 'src/core/utils/google-analytics'
import TabService from 'src/services/TabService'
import { SetReminderCommand } from 'src/tabsets/commands/SetReminderCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import PanelTabListElementWidget from 'src/tabsets/widgets/PanelTabListElementWidget.vue'
import { onMounted, ref, watchEffect } from 'vue'

export interface Dictionary<T> {
  [index: string]: T
}

const tabsetsSessions = ref<Tabset[]>([])
const userCanSelect = ref(false)

const groupedTabs = ref<Dictionary<Tab[]> | undefined>(undefined)

onMounted(async () => {
  Analytics.firePageViewEvent('SidePanelRemindersListViewer', document.location.href)

  groupedTabs.value = _.groupBy(useTabsetsStore().reminderTabset.tabs, (t: Tab) => t.reminder)
})

watchEffect(() => {
  userCanSelect.value = false
})

const clearReminder = (tab: Tab) => {
  useCommandExecutor()
    .execute(new SetReminderCommand(tab.id, undefined, undefined))
    .then(() => {
      useTabsetsStore().removeReminder(tab)
    })
}
</script>

<style lang="sass" scoped>

.tabBorder
  border-radius: 5px 5px 0 0
  border: 1px solid $lightgrey
  border-bottom: 0
</style>
