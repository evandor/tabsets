<template>
  <div v-for="f in feed" class="q-ma-sm">
    <div class="row" @click="open(f)">
      <div class="col-2 q-ml-sm q-mt-xs">
        <q-img class="rounded-borders cursor-pointer" v-if="f.img" :src="f.img" style="width: 55px; height: 55px" />
      </div>
      <div class="col">
        {{ f.title }}
        <div class="ellipsis-2-lines text-caption">{{ f.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { parseFeed } from '@rowanmanning/feed-parser'
import * as cheerio from 'cheerio'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useUtils } from 'src/core/services/Utils'
import { onMounted, ref } from 'vue'

const { sanitizeAsPlainText } = useUtils()

type Item = { title: string; url: string; desc: string; published: string; img?: string }

const props = defineProps<{ url: string }>()

const feed = ref<Item[]>([])

onMounted(async () => {
  const response = await fetch(props.url)
  const responseText = await response.text()
  //console.log("reponse", responseText)

  feed.value = []
  const f = parseFeed(responseText)
  //console.log(JSON.stringify(f))

  const itemsArray = Array.from(f.items).splice(0, 20)
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
    feed.value.push({ title, url, desc, published, img })
  })
})

const open = (f: Item) => useNavigationService().browserTabFor(f.url)
</script>
