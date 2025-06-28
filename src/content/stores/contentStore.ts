import { Readability } from '@mozilla/readability'
import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { defineStore } from 'pinia'
import { uid } from 'quasar'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import BexFunctions from 'src/core/communication/BexFunctions'
import { computed, ref, watchEffect } from 'vue'

/**
 * this content store is meant to track transient state of the currently opened tab.
 *
 * Once the current content of a tab is set by calling setCurrentTabContent, the content
 * will be analysed.
 */
export const useContentStore = defineStore('content', () => {
  const currentTabContent = ref<string>('')
  const currentTabMetas = ref<object>({})
  const currentTabUrl = ref<string | undefined>(undefined)
  const currentTabFavIcon = ref<string | undefined>(undefined)
  const currentTabTitle = ref<string | undefined>(undefined)
  const currentTabLastAccessed = ref<number | undefined>(undefined)
  const currentTabArticle = ref<object | undefined>(undefined)
  const articleSnapshot = ref<object | undefined>(undefined)
  const currentTabReferences = ref<TabReference[]>([])

  const setCurrentTabContent = (content: string | undefined) => {
    //console.debug(`setting current tab content with length ${content?.length}, ${content?.substring(0, 230)}`)
    currentTabContent.value = content ? content : ''
  }

  const setCurrentTabMetas = (metas: object = {}) => {
    console.debug('setting current tab metas: #', Object.keys(metas).length)
    currentTabMetas.value = metas
  }

  const setCurrentTabUrl = (url: string | undefined) => {
    //console.debug(`setting current tab url to '${url}'`)
    currentTabUrl.value = url
  }

  const resetFor = async (browserTab: chrome.tabs.Tab) => {
    console.log('reset', browserTab)
    currentTabUrl.value = browserTab.url
    currentTabFavIcon.value = browserTab.favIconUrl
    currentTabTitle.value = browserTab.title
    currentTabLastAccessed.value = browserTab.lastAccessed
    currentTabContent.value = ''
    currentTabMetas.value = {}
    currentTabArticle.value = undefined

    if (browserTab.url) {
      const r = await chrome.tabs.sendMessage(browserTab.id || 0, 'getExcerpt', {}) //, async (res) => {
      //console.log('getContent returned result with length', r, r?.html.length, browserTab.id)
      await BexFunctions.handleBexTabExcerpt({ from: '', to: '', event: '', payload: r })
    }
  }

  watchEffect(() => {
    currentTabReferences.value = []
    if (currentTabContent.value.trim().length > 0) {
      console.debug(`updating content store... (length ${currentTabContent.value.trim().length})`)
      const $ = cheerio.load(currentTabContent.value)
      checkLinks($)
      checkMeta($)
      checkScripts($)
      checkArticle()
      // worth it? has issues with repeated calls of this watchEffect block
      // await checkPaths()
    }
  })

  const checkLinks = ($: CheerioAPI) => {
    for (const elem of $('link')) {
      const rel = $(elem).attr('rel')
      const type = $(elem).attr('type')
      const title = $(elem).attr('title')
      const href = $(elem).attr('href')
      if (
        rel &&
        rel === 'alternate' &&
        type &&
        (type === 'application/rss+xml' || type === 'application/atom+xml') &&
        href
      ) {
        let useHref = href
        if (href.startsWith('/')) {
          try {
            const theURL = new URL(currentTabUrl.value || '')
            useHref = theURL.protocol + '//' + theURL.hostname + href
          } catch (e) {
            // ignore
          }
        }
        currentTabReferences.value.push(new TabReference(uid(), TabReferenceType.RSS, title || 'no title', [], useHref))
        //console.log('Found TabReference RSS', currentTabReferences.value.length, currentTabReferences.value)
      }
      if (
        rel &&
        rel === 'search' &&
        type &&
        type === 'application/opensearchdescription+xml' &&
        href &&
        currentTabUrl.value
      ) {
        try {
          const theURL = new URL(currentTabUrl.value)
          const useUrl =
            href.startsWith('http://') || href.startsWith('https://')
              ? href
              : theURL.protocol + '//' + theURL.host + href
          console.log('analyse application/opensearchdescription+xml link: ', href, useUrl)
          fetch(useUrl)
            .then((res) => res.text())
            .then((text: string) => {
              // console.log('found text', text)
              currentTabReferences.value.push(
                new TabReference(uid(), TabReferenceType.OPEN_SEARCH, 'opensearch', [{ xml: text }], href),
              )
              console.log('Found TabReference', currentTabReferences.value)
            })
        } catch (err) {
          console.log('not able to create opensearch tabReference for', currentTabUrl.value)
        }
      }
    }
  }

  const checkMeta = ($: CheerioAPI) => {
    const openGraphRefs: object[] = []
    const metadataRefs: object[] = []

    function addFromMeta(identifier: string, name: string | undefined, content: string | undefined) {
      if (name && name === identifier && content) {
        metadataRefs.push({ name, content })
        //console.log("Found TabReference for meta data", name, content)
      }
    }

    for (const elem of $('meta')) {
      const name = $(elem).attr('name')
      const property = $(elem).attr('property')
      const content = $(elem).attr('content')
      if (property && property.startsWith('og:') && content) {
        openGraphRefs.push({ property, content })
        // console.log("Found TabReference for OpenGraph", property, content)
      }
      addFromMeta('copyright', name, content)
      addFromMeta('email', name, content)
      addFromMeta('author', name, content)
      addFromMeta('date', name, content)
      addFromMeta('last-modified', name, content)
      addFromMeta('locale', name, content)
      addFromMeta('description', name, content)
    }
    currentTabReferences.value.push(new TabReference(uid(), TabReferenceType.OPEN_GRAPH, 'Open Graph', openGraphRefs))
    currentTabReferences.value.push(new TabReference(uid(), TabReferenceType.META_DATA, 'Meta Data', metadataRefs))
  }

  const checkScripts = ($: CheerioAPI) => {
    for (const elem of $('script')) {
      const type = $(elem).attr('type')
      if (type && type === 'application/ld+json') {
        try {
          const text = $(elem).contents().first().text()
          // console.log("got", text)
          const asJSON = JSON.parse(text)
          currentTabReferences.value.push(
            new TabReference(uid(), TabReferenceType.LINKING_DATA, 'Linking Data', asJSON),
          )
          //console.log("Found TabReference", currentTabReferences.value)
        } catch (err) {
          console.warn('could not parse linking data', err)
        }
      }
    }
  }

  //const sanitized = sanitizeAsHtml(currentTabContent.value)
  const checkArticle = () => {
    const parser = new DOMParser()
    const reader = new Readability(parser.parseFromString(currentTabContent.value, 'text/html'))
    const article = reader.parse()
    currentTabArticle.value = article?.title ? article : undefined
    if (currentTabArticle.value) {
      articleSnapshot.value = currentTabArticle.value
      console.log('articleSnapshot:', articleSnapshot.value)
    }
  }

  const checkPaths = async () => {
    if (currentTabUrl.value && currentTabUrl.value.indexOf('://') >= 0) {
      // TODO can this be outdated?
      const anchorSplit = currentTabUrl.value.split('#')
      if (anchorSplit.length === 2) {
        currentTabReferences.value.push(
          new TabReference(uid(), TabReferenceType.ANCHOR, anchorSplit[1]!, [], currentTabUrl.value),
        )
      }
      const protocol = currentTabUrl.value.split('://')[0]
      let pathSplit: string[] = currentTabUrl.value
        .split('://')[1]!
        .split('/')
        .filter((p) => p.trim() !== '')
      const parentChainData = []
      if (pathSplit.length > 0) {
        pathSplit.pop()
      }
      var initialLength = pathSplit.length
      for (var i = 0; i < initialLength; i++) {
        console.log('checking', i, pathSplit.length, pathSplit.join('/'))
        if (protocol === 'chrome' || protocol === 'file') {
          break
        }
        try {
          const theURL = new URL(protocol + '://' + pathSplit.join('/'))
          console.log('fetchging', theURL.toString())
          const res = await fetch(theURL.toString(), { method: 'HEAD' })
          const headers: any[] = []
          res.headers.forEach((value, key, p) => {
            headers.push({ [key]: value })
          })
          const responseAsJson = JSON.parse(
            JSON.stringify({
              ok: res.ok,
              headers: headers,
              redirected: res.redirected,
              status: res.status,
              type: res.type,
            }),
          )
          // console.log("got", responseAsJson)
          if (res.ok) {
            parentChainData.push({
              originalURL: currentTabUrl.value,
              parent: theURL.toString(),
              level: initialLength - i,
              response: responseAsJson,
            })
          }
        } catch (err) {
          console.warn('===>', err)
        }
        pathSplit.pop()
      }
      if (parentChainData.length > 0) {
        currentTabReferences.value.push(
          new TabReference(
            uid(),
            TabReferenceType.PARENT_CHAIN,
            'Parent Chain for ' + currentTabUrl.value,
            parentChainData,
            currentTabUrl.value,
          ),
        )
      }
    }
  }

  const resetCurrentTabArticle = () => (currentTabArticle.value = undefined)

  const getCurrentTabUrl = computed((): string | undefined => {
    return currentTabUrl.value
  })

  const getCurrentTabContent = computed((): string | undefined => currentTabContent.value)
  const getCurrentTabMetas = computed((): object => currentTabMetas.value)
  const getCurrentTabReferences = computed((): TabReference[] => currentTabReferences.value)

  return {
    currentTabArticle,
    resetCurrentTabArticle,
    setCurrentTabContent,
    getCurrentTabContent,
    setCurrentTabMetas,
    getCurrentTabMetas,
    setCurrentTabUrl,
    getCurrentTabUrl,
    currentTabReferences,
    getCurrentTabReferences,
    resetFor,
    currentTabFavIcon,
    currentTabMetas,
    currentTabTitle,
    articleSnapshot,
  }
})
