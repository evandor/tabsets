<template>
  <q-separator inset />
  <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="sym_o_article" color="primary" label="New Page">
    <!--    <q-tooltip class="tooltip-small" v-if="props.tabset.sharing?.sharedId !== undefined">-->
    <!--      Stop sharing first if you want to delete this tabset-->
    <!--    </q-tooltip>-->
  </ContextMenuItem>
</template>
<script setup lang="ts">
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import { CreatePageCommand } from 'src/tabsets/commands/cms/CreatePageCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { useRouter } from 'vue-router'

const props = defineProps<ActionProps>()

const router = useRouter()

const clicked = () => {
  useCommandExecutor()
    .executeFromUi(new CreatePageCommand())
    .then((res: ExecutionResult<Tab>) => {
      useNavigationService().browserTabFor(res.result.url || '')
    })
}
</script>
