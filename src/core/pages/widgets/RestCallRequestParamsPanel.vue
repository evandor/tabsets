<template>
  <div class="q-mb-md">
    <div>
      <template v-if="Object.keys(props.restTab?.paramsTemplates || {}).length > 0">
        <div class="row">
          <div class="col-11">
            <q-select
              label="Template"
              v-model="selectedTemplate"
              :options="Array.from(Object.keys(restTab?.paramsTemplates || {}))"
              @update:model-value="(val: string) => updateTemplate(val)" />
          </div>
          <div class="col"></div>
        </div>
        <div class="col-12">
          <hr />
        </div>
      </template>
      <div v-for="p in restTab?.params">
        <div class="row">
          <div class="col-11">
            <q-input
              outlined
              hide-hint
              class="q-mt-md"
              v-if="p['paramType' as keyof object] === 'STRING'"
              type="text"
              v-model="p['val' as keyof object]"
              :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
              :rules="p['condition' as keyof object] === 'REQUIRED' ? [(val) => !!val || 'Field is required'] : []" />
            <q-input
              outlined
              class="q-mt-md"
              v-else-if="p['paramType' as keyof object] === 'NUMBER'"
              type="text"
              v-model="p['val' as keyof object]"
              :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
              :rules="p['condition' as keyof object] === 'REQUIRED' ? [(val) => !!val || 'Field is required'] : []" />
            <q-select
              outlined
              class="q-mb-md"
              v-else-if="p['paramType' as keyof object] === 'BOOLEAN'"
              :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
              :options="['Do not include in request', 'true', 'false']"
              v-model="p['val' as keyof object]" />
            <q-input
              outlined
              v-else-if="p['paramType' as keyof object] === 'DATE (YYYY-MM-DD)'"
              :label="p['name' as keyof object] + (p['condition' as keyof object] === 'REQUIRED' ? '*' : '')"
              :options="['Do not include in request', 'true', 'false']"
              v-model="p['val' as keyof object]" />
            <div v-else>
              {{ p }}
            </div>
          </div>
          <div class="col text-right q-mt-md">
            <q-icon name="sym_o_help" v-if="p['description' as keyof object]">
              <q-tooltip class="tooltip-small">{{ p['description' as keyof object] }}</q-tooltip>
            </q-icon>
          </div>
        </div>
      </div>
      <div class="text-right cursor-pointer">
        <div class="row">
          <div class="col-12">
            <hr />
          </div>
        </div>
        <div class="row">
          <div class="col-11">
            <q-btn
              size="sm"
              label="delete template"
              class="q-mr-sm"
              @click="deleteTemplate()"
              v-if="selectedTemplate" />
            <q-btn size="sm" label="save template" class="q-mr-sm" @click="saveTemplate()" />
            <q-btn size="sm" type="submit" label="call api" @click="emits('callApi')" />
          </div>
          <div class="col"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { ParamTemplateKeyValue, RestParam, RestTab } from 'src/rest/models/RestTab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref } from 'vue'

const $q = useQuasar()

const props = defineProps<{ restTab: RestTab | undefined }>()
const emits = defineEmits(['callApi'])

const selectedTemplate = ref<string | undefined>(undefined)
const templateName = ref('')

const updateTemplate = (val: string) => {
  console.log('val', val)
  if (props.restTab) {
    const selectedTemplate: ParamTemplateKeyValue[] | undefined = props.restTab.paramsTemplates[val]
    if (selectedTemplate) {
      props.restTab?.params.forEach((p: RestParam) => {
        const match = selectedTemplate.filter((kv) => kv[0] === p.name)
        if (match && match.length > 0) {
          p.val = match[0]![1]
        }
      })
    }
  }
}

const deleteTemplate = () => {
  if (props.restTab && selectedTemplate.value) {
    delete props.restTab.paramsTemplates[selectedTemplate.value]
  }
  save()
}

const saveTemplate = () => {
  $q.dialog({
    title: 'Save Request Params As Template',
    message: 'Provide a name for the template',
    prompt: { model: templateName.value, isValid: (val: string) => val.length > 2, type: 'text' },
    cancel: true,
    persistent: true,
  }).onOk((data: any) => {
    console.log('data', data)
    console.log('restTab', props.restTab?.params)
    const rt: RestTab = Object.assign(
      new RestTab('', 'title', 'https://skysail.io', 'OBSIDIAN', '', '', ''),
      props.restTab!,
    )

    //const rt: RestTab = new RestTab(JSON.parse(restTab.value!)))
    const keyValues: ParamTemplateKeyValue[] = []
    props.restTab!.params.forEach((p) => {
      keyValues.push([p.name, p.val])
    })
    rt.addParamsTemplate(data, keyValues)
    save()
    //restTab.value!.addParamsTemplate(data, restTab.value!.params)
  })
}

const save = () => {
  const ts = useTabsetsStore().getCurrentTabset
  useTabsetsStore().saveTabset(ts!)
}
</script>
