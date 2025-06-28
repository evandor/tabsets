<template>
  <template v-if="props.element === 'contextmenu'">
    <ContextMenuItem v-close-popup @was-clicked="clicked()" icon="sym_o_refresh" color="primary" :label="label" />
  </template>
  <template v-else>
    <fab-like-btn @button-clicked="clicked()" color="warning" icon="sym_o_refresh" />
  </template>
</template>

<script lang="ts" setup>
import { parseFeed } from '@rowanmanning/feed-parser'
import { FeedCategory } from '@rowanmanning/feed-parser/lib/feed/base'
import * as cheerio from 'cheerio'
import { uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import ContextMenuItem from 'src/core/components/helper/ContextMenuItem.vue'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { ActionProps } from 'src/tabsets/actions/models/ActionProps'
import FabLikeBtn from 'src/tabsets/actions/widgets/FabLikeBtn.vue'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab, UrlExtension } from 'src/tabsets/models/Tab'
import { ref } from 'vue'

const props = defineProps<ActionProps>()

const { sanitizeAsPlainText } = useUtils()

const label = ref('Load RSS Feed')

const clicked = async () => {
  console.log('loading...', props.currentChromeTab?.id, props.folder)
  if (!props.folder || !props.folder.dynamicUrl) {
    return Promise.reject('no folder or dynamic url set')
  }
  console.log('getting RSS feed from ', props.folder.dynamicUrl)

  const response = await fetch(props.folder.dynamicUrl)
  const responseText = await response.text()
  //console.log("reponse", responseText)

  const feed = parseFeed(responseText)
  console.log(JSON.stringify(feed))

  const itemsArray = Array.from(feed.items).splice(0, 20)
  itemsArray.forEach((item: any) => {
    console.log('item: ', item)
    //const title = additionalData['feedname'] || 'no title' //this.getFromItem(item, "title", "no title")
    const title = item.title
    const url = item.url

    const desc = sanitizeAsPlainText(item.description) || ''
    const published = item.published //item.querySelector("pubDate")?.innerHTML || undefined
    //const enclosure: Element | null = item.querySelector("enclosure")
    let img = item.image?.url //enclosure ? enclosure.getAttribute("url") : undefined
    console.log('img', img)
    if (!img) {
      const snippet = item.content || item.description || 'no content'
      console.log('snippet', snippet)
      var $ = cheerio.load(snippet)
      img = $('img').attr('src')
      console.log('img set to', img)
    }

    const newTab = new Tab(uid(), BrowserApi.createChromeTabObject(title || '', url || ''))
    newTab.description = desc
    newTab.image = img
    newTab.extension = UrlExtension.RSS
    Tab.setTags(
      newTab,
      item.categories.map((c: FeedCategory) => c.term),
    )
    if (published) {
      newTab.created = new Date(published).getTime()
    }
    useCommandExecutor()
      .execute(new AddTabToTabsetCommand(newTab, props.tabset, props.folder?.id, false, true))
      .catch((error: any) => {})
  })
  return Promise.resolve(new ExecutionResult('', ''))
}
</script>
