<template>

  <q-item-section class="q-mr-sm" style="max-width:20px; border:1px solid red">
<!--    <TabFaviconWidget :tab="props.entity" width="20px" height="20px" style="position: relative;top:-10px"/>-->
    <q-img :src="props.entity?.data.img" />
  </q-item-section>

  <!-- name, title, url && note -->
  <q-item-section :style="itemStyle(props.entity)">

    <!-- name or title -->
    <q-item-label>
      <RenderTitle :data="props.entity" :definition="useEntitiesStore().entityDefinitions.get(props.type)['render']" />
      <div>
        <div class="q-pr-lg cursor-pointer" style="font-size: larger;line-height: 120%;">
          {{ nameOrTitle(props.entity) }}
        </div>

      </div>
    </q-item-label>

    <!-- url -->
    <q-item-label
      v-if="props.entity?.data?.url"
      caption class="ellipsis-2-lines text-blue-10"
      @mouseover="showButtonsProp = true"
      @mouseleave="showButtonsProp = false">
      <div class="q-pr-lg cursor-pointer" style="display: inline-block;"
           @click.stop="NavigationService.openOrCreateTab(urlWithSubstitutions() )">
        {{ urlWithSubstitutions().split('?')[0] }}
        <q-icon name="open_in_new"/>

      </div>
    </q-item-label>

  </q-item-section>

  <!-- new tab and edit note buttons -->
  <q-item-section side v-if="props.showButtons">
    <div class="row">
      <q-btn v-if="usePermissionsStore().hasFeature(FeatureIdent.NEW_TAB)"
             flat round color="primary" size="11px" icon="o_create_new_folder"
             @click.stop="addToNewTabUrlList(tab)">
        <q-tooltip class="tooltip">Add this tab to the list of tabs showing when you open a new tab in your browser
        </q-tooltip>
      </q-btn>
    </div>
  </q-item-section>
  <q-item-section side v-else>
    <div v-if="usePermissionsStore().hasFeature(FeatureIdent.NEW_TAB)"
         style="min-width:35px;">&nbsp;
    </div>
    <div style="min-width:35px;">&nbsp;</div>
  </q-item-section>

  <!-- Delete button -->
  <q-item-section side v-if="props.showButtons">
    <q-btn flat round color="red" size="11px" icon="delete_outline" @click.stop="deleteEntity(entity)">
      <q-tooltip>Delete this entry from this list</q-tooltip>
    </q-btn>
  </q-item-section>
  <q-item-section side v-else>
    <q-btn flat round color="red" size="11px"/>
  </q-item-section>

</template>

<script setup lang="ts">
import NavigationService from "src/services/NavigationService";
import {h, ref} from "vue";
import {useCommandExecutor} from "src/services/CommandExecutor";
import {useQuasar} from "quasar";
import {usePermissionsStore} from "src/stores/permissionsStore";
import TabFaviconWidget from "components/widgets/TabFaviconWidget.vue";
import {FeatureIdent} from "src/models/AppFeature";
import {Entity} from "src/models/Entity";
import {DeleteEntityCommand} from "src/domain/entities/DeleteEntity";
import RenderTitle from "components/rendering/RenderTitle.vue";
import {useEntitiesStore} from "stores/entitiesStore";

const vnode = h('div', { id: 'foo' }, [])

const props = defineProps({
  entity: {type: Object, required: true},
  type: {type: String, required: true},
  collectionId: {type: String, required: true},
  showButtons: {type: Boolean, default: false},
  showIsOpened: {type: Boolean, default: true},
  highlightUrl: {type: String, required: false}
})

const emits = defineEmits(['sendCaption'])

const $q = useQuasar()

const line = ref(null)
const showButtonsProp = ref<boolean>(false)


function getShortHostname(host: string) {
  const nrOfDots = (host.match(/\./g) || []).length
  if (nrOfDots >= 2) {
    return host.substring(host.indexOf(".", nrOfDots - 2) + 1)
  }
  return host
}

function getHost(urlAsString: string, shorten: Boolean = true): string {
  try {
    const url = new URL(urlAsString)
    if (!shorten) {
      return url.protocol + "://" + url.host.toString()
    }
    return getShortHostname(url.host)
  } catch (e) {
    return "---";
  }
}

const itemStyle = (entity: Entity) => {
  let border = ""
  let background = ''
  // if (entity.data?['url'] === props.highlightUrl) {
  //   border = "border: 1px dotted orange; padding:15px; border-radius:5px"
  // }
  return `${border};${background}`
}


const setInfo = (entity: Entity) => {
  // const parts = (entity.data?.url || '').split('?')
  // if (parts.length > 1) {
  //   emits('sendCaption', parts[0] + "[... params omitted....]")
  // } else if (parts.length === 1) {
  //   emits('sendCaption', parts[0].toString());
  // }
}

const selectTab = (entity: Entity) => {
  // TabsetService.setOnlySelectedTab(tab)
  // const notificationStore = useNotificationsStore()
  // notificationStore.setSelectedTab(tab)
}


const getFaviconUrl = (chromeTab: chrome.tabs.Tab | undefined) => {
  if (chromeTab && chromeTab.favIconUrl && !chromeTab.favIconUrl.startsWith("chrome")) {
    return chromeTab.favIconUrl
  }
  return ''//'favicon-unknown-32x32.png'
}

const deleteEntity = (entity: Entity) => useCommandExecutor()
  .executeFromUi(new DeleteEntityCommand(props.type, props.collectionId,  entity))


const addToNewTabUrlList = (entity: Entity) => {
  // console.log("got tab", tab)
  // useUiStore().addToNewTabUrlList({
  //   url: entity.data?.url,
  //   title: entity.data?.title,
  //   favIconUrl: entity.data.favIconUrl
  // })
}

const nameOrTitle = (entity: Entity) => {
  return entity?.name //? entity.name : entity.data?.title
}

const urlWithSubstitutions = () => {
  var url = props.entity.data.url
  if (url) {
    console.log("url", url)
    const placeholders = url.match(/\{\{(.*?)\}\}/g)
    console.log("placeholders", placeholders)
    if (placeholders) {
      placeholders.forEach(function (placeholder: any) {
        console.log("placeholder", placeholder)
        const ident = placeholder.substring(2, placeholder.length - 2);
        console.log("phText", ident)
        if (props.entity.data[ident]) {
          url = url.replace(placeholder, props.entity.data[ident])
        }
      })
    }
    return url
  }
  return ""
}


</script>
