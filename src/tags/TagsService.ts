import { TAGS_IGNORED } from 'boot/constants'
import nlp from 'compromise'
import speech from 'compromise-speech'
import stats from 'compromise-stats'
// @ts-expect-error xxx
import { Term } from 'compromise/types/misc'
// @ts-expect-error xxx
import View from 'compromise/types/view/one'
// @ts-expect-error xxx
import nlpDE from 'de-compromise'
import _ from 'lodash'
import { LocalStorage } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useCategorizationService } from 'src/categorization/CategorizationService'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useContentStore } from 'src/content/stores/contentStore'
import { CategoryInfo, TagInfo, TagType } from 'src/core/models/TagInfo'
import { useUtils } from 'src/core/services/Utils'
import ContentUtils from 'src/core/utils/ContentUtils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { Tab, TabCategory } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

const { extractSecondLevelDomain } = useUtils()

function removeDuplicatesByProperty<T>(array: T[], property: keyof T): T[] {
  const uniqueMap = new Map<any, T>()

  array.forEach((item) => {
    const propertyValue = item[property]
    if (!uniqueMap.has(propertyValue)) {
      uniqueMap.set(propertyValue, item)
    }
  })

  return Array.from(uniqueMap.values())
}

function addByTypeIfNotExisting(type: TagType, tags: TagInfo[], tagsToUse: TagInfo[]): void {
  const filteredTags = removeDuplicatesByProperty(
    tags
      .filter((t: TagInfo) => t.type === type)
      .filter((t: TagInfo) => tagsToUse.map((t: TagInfo) => t.label).indexOf(t.label) < 0),
    'label',
  )

  tagsToUse.push(...filteredTags)
}

function sanitizeContent(s: string): string {
  // console.log('s', typeof s, s)
  return s.replace(/[^\wäöüßÄÖÜ\s]/gi, '')
}

// const catService = new CategorizationService()

export function useTagsService() {
  const deduplicateTags = (tags: TagInfo[]): TagInfo[] => {
    //console.log('deduplicating', tags)
    const tagsToUse = removeDuplicatesByProperty(
      tags.filter((t: TagInfo) => t.type === 'manual'),
      'label',
    )
    addByTypeIfNotExisting('url', tags, tagsToUse)
    addByTypeIfNotExisting('hierarchy', tags, tagsToUse)
    addByTypeIfNotExisting('languageModel', tags, tagsToUse)
    addByTypeIfNotExisting('keyword', tags, tagsToUse)
    addByTypeIfNotExisting('langDetection', tags, tagsToUse)
    addByTypeIfNotExisting('classification', tags, tagsToUse)
    addByTypeIfNotExisting('linkingData', tags, tagsToUse)
    return tagsToUse
  }

  const tagsFromKeywords = (keywordsString: string): TagInfo[] => {
    console.log(' <> tagsFromKeywords', keywordsString)
    const ignoredList: string[] = LocalStorage.getItem(TAGS_IGNORED) || []
    const keywords = [
      ...new Set(
        keywordsString
          .split(',')
          .map((k: string) => sanitizeContent(k.trim().toLowerCase()))
          .filter((k: string) => k.length > 2 && k.length <= 12)
          .filter((k: string) => ignoredList.indexOf(k) < 0),
      ),
    ]
    const result: TagInfo[] = keywords.map((k: string) => {
      return { label: sanitizeContent(k.trim()), type: 'keyword', score: 1 }
    })
    console.log(' <> tagsFromKeywords', result)
    return result
  }

  const tagsFromReferences = (tfs: TabReference[]): TagInfo[] => {
    //console.log(' <> tagsFromReferences', tfs)

    const linkingData: TabReference[] = tfs.filter((tR: TabReference) => tR.type === TabReferenceType.LINKING_DATA)
    const result: TagInfo[] = linkingData
      .flatMap((tR: TabReference) => {
        // console.log('tR->', typeof tR.data, tR.data)
        if (Array.isArray(tR.data)) {
          return [...tR.data]
        } else {
          return [tR.data]
        }
      })
      .map((data: object) => {
        const linkedDataType = data['@type' as keyof object]
        //console.log('linkedDataType->', linkedDataType)
        switch (typeof linkedDataType) {
          case 'string':
            const catAsString = data['@type' as keyof object] as unknown as string
            return { label: sanitizeContent(catAsString), type: 'linkingData', score: 1 }
          case 'object':
            const cat = data['@type' as keyof object] as unknown as object
            const keys: string[] = Object.keys(cat)
            if (keys.length > 0) {
              const value = cat[keys[0] as keyof object]
              return { label: sanitizeContent(value), type: 'linkingData', score: 1 }
            }
            return { label: '', type: 'linkingData', score: 0 }
          default:
            return { label: '', type: 'linkingData', score: 0 }
        }
      })

    // console.log('---r', r)

    // const result: TagInfo[] = tfs
    //   .filter((tR: TabReference) => tR.type === TabReferenceType.LINKING_DATA)
    //   .filter((tR: TabReference) => tR.data && tR.data['@type' as keyof object])
    //   .map((tR: TabReference) => {
    //     const linkedDataType = tR.data['@type' as keyof object]
    //     console.log('linkedDataType->', linkedDataType)
    //     switch (typeof linkedDataType) {
    //       case 'string':
    //         const catAsString = tR.data['@type' as keyof object]! as unknown as string
    //         return { label: sanitizeContent(catAsString), type: 'linkingData', score: 1 }
    //       case 'object':
    //         const cat = tR.data['@type' as keyof object]! as unknown as object
    //         const keys: string[] = Object.keys(cat)
    //         if (keys.length > 0) {
    //           const value = cat[keys[0] as keyof object]
    //           return { label: sanitizeContent(value), type: 'linkingData', score: 1 }
    //         }
    //         return { label: '', type: 'linkingData', score: 0 }
    //       default:
    //         return { label: '', type: 'linkingData', score: 0 }
    //     }
    //   })
    //console.log(' <> tagsFromReferences', result)
    return result.filter((t: TagInfo) => t.label.length > 2)
  }

  const tagsFromHierarchy = (ts: Tabset): TagInfo[] => {
    const folderChain = useTabsetsStore().getFolderNameChain(ts, ts.folderActive || ts.id)
    console.log(' <> tags from hierarchy:', folderChain.join(', '))
    const hierarchies: TagInfo[] = folderChain
      .map((name: string) => sanitizeContent(name.replaceAll(' ', '').trim().toLowerCase()))
      .map((name: string) => {
        return { label: sanitizeContent(name), type: 'hierarchy', score: 1 }
      })
    console.log(' <> tags from hierarchy:', hierarchies)
    return hierarchies
  }

  const tagsFromUrl = (url: string | undefined, language: string): TagInfo[] => {
    console.log(' <> tags from URL', url, language)
    if (!url) {
      return []
    }
    const result: TagInfo[] = []
    const domain = extractSecondLevelDomain(url)
    if (domain) {
      result.push({ label: sanitizeContent(domain), type: 'url', score: 1 })
    }
    try {
      const theURL = new URL(url)
      const split: string[] = theURL.hostname.split('.')
      const topLevelDomain = split[split.length - 1]
      if (topLevelDomain) {
        result.push({ label: topLevelDomain, type: 'url', score: 1 })
      }
      console.log(
        ' <> tags from URL',
        theURL.pathname.length > 40 ? theURL.pathname.substring(0, 40) + '...' : theURL.pathname,
      )
      const urlParts = theURL.pathname
        .replace('.html', '')
        .split('/')
        .flatMap((path: string) => {
          return path.split('-')
        })
        .flatMap((path: string) => {
          return path.split('_')
        })
        .join(' ')

      return tagsFromLanguageModel(urlParts, language, 'url')
      // theURL.pathname
      //   .replace('.html', '')
      //   .split('/')
      //   .flatMap((path: string) => {
      //     return path.split('-')
      //   })
      //   .flatMap((path: string) => {
      //     return path.split('_')
      //   })
      //   .map((p: string) => p.trim().toLowerCase())
      //   .map((p: string) => p.replace(/\d/g, '')) // no numbers please
      //   .filter((p: string) => p.length > 2 && p.length <= 26)
      //   .forEach((p: string) => {
      //     result.push({ label: p, type: 'url', score: 1 })
      //   })
    } catch (e: any) {}
    console.log(' <> tags from URL:', result)
    return result
  }

  const tagsFromClassification = (
    cats: CategoryInfo[],
    labels: string[],
    scores: number[],
    threshold: number,
  ): TagInfo[] => {
    const result: TagInfo[] = []
    if (labels.length == 0) {
      return result
    }
    labels.forEach((label: string, index: number) => {
      const weight: number = cats.find((c: CategoryInfo) => c.label === label)?.weight || 1
      console.log(
        `classification with threshold ${threshold}, label ${label}, scores ${scores[index]}, weight: ${weight}`,
      )
      if (scores[index]! * weight >= threshold) {
        result.push({ label: label, type: 'classification', score: scores[index]! })
      }
    })
    return result
  }

  const tagsFromLangDetection = (detectedLanguage: string, detectedConfidence: number): TagInfo[] => {
    return [
      {
        label: detectedLanguage,
        type: 'langDetection',
        score: detectedConfidence || 0,
      },
    ]
  }

  const tagsFromLanguageModel = (text: string, language: string, source: TagType): TagInfo[] => {
    let result: TagInfo[] = []
    //console.log(` <> tags from description (${language})`, text.length > 40 ? text.substring(0, 40) + '...' : text)
    let doc: View | undefined = undefined
    switch (language) {
      case 'de':
        //console.log(' <> using german')
        nlpDE.plugin(speech)
        nlpDE.plugin(stats)
        doc = nlpDE(text)
        break
      default:
        //const nlp = import('compromise')
        //console.log(' %% using default')
        nlp.plugin(speech)
        nlp.plugin(stats)
        // const nlpEx = nlp.extend(stats)
        doc = nlp(text)
    }
    // doc.compute('syllables')
    // console.log(' <> ===>', doc.json({ syllables: true }))
    //console.log(' <> ===>1', doc.compute('tfidf').json())

    const tokenAnalysis = doc.compute('tfidf').json({
      text: false,
      normal: true,
      implicit: false, // contractions, etc.
      offset: false,
      unique: true,
      confidence: false,
      terms: {
        text: false,
        normal: true,
        clean: true,
        implicit: false,
        tags: true,
        whitespace: false,
        offset: false,
        bestTag: true,
      },
    })
    // const tokenAnalysis = doc.compute('tagRank').json()
    //console.log(' <> ===>2', tokenAnalysis)
    // tokenAnalysis.result.forEach((token: any) => {})

    // console.log('keys', Object.keys(tokenAnalysis))
    //const terms: TfidfToken[]
    const terms: Term[] = []
    const termList: string[] = []
    Object.keys(tokenAnalysis).forEach((o: any) => {
      //console.log('key', tokenAnalysis[o])
      tokenAnalysis[o]['terms'].forEach((term: Term) => {
        // console.log('--->', term)
        if (
          term.normal.length > 2 &&
          term.chunk !== 'Verb' &&
          term.chunk !== 'Adjective' &&
          term.chunk !== 'VerbInfinitive' &&
          term.tags.indexOf('Adverb') < 0 &&
          term.tags.indexOf('Adjective') < 0 &&
          term.tags.indexOf('Preposition') < 0 &&
          term.tags.indexOf('Ordinal') < 0 &&
          term.tags.indexOf('Cardinal') < 0 &&
          term.tags.indexOf('Determiner') < 0 &&
          term.tags.indexOf('Conjunction') < 0 &&
          term.tags.indexOf('Pronoun') < 0 &&
          term.tags.indexOf('QuestionWord') < 0 &&
          termList.findIndex((t: string) => t === term.normal) < 0
        ) {
          termList.push(term.normal)
          terms.push(term)
        }
      })
    })
    const sortedTerms = terms.sort((a: Term, b: Term) => b['tfidf'] - a['tfidf'])
    // sortedTerms.forEach((t: Term) => {
    //   console.log('===>', t.normal, t.tfidf)
    // })

    const maxTerms = Math.min(10, sortedTerms.length)
    const firstTerms = sortedTerms.slice(0, maxTerms)
    return firstTerms.map((t: Term) => {
      return { label: t.normal, type: source, score: t.tfidf }
    })
  }

  function getDynamicTabsBy(tags: string[]) {
    const result: IndexedTab[] = []
    const term: string = tags.length > 0 ? (tags[0] as string) : ''
    let i = 0
    _.forEach([...useTabsetsStore().tabsets.values()] as Tabset[], (tabset: Tabset) => {
      _.forEach(tabset.tabs, (tab: Tab) => {
        if (tab.tagsInfo?.map((t: TagInfo) => t.label).indexOf(term) >= 0) {
          //console.log("found tab", term, tab.tags)
          result.push(new IndexedTab(i++, tab))
        }
      })
    })
    return result
  }

  const addToIgnored = (v: string) => {
    const tags = (LocalStorage.getItem(TAGS_IGNORED) as string[]) || []
    if (tags.indexOf(v) < 0) {
      tags.push(v)
      LocalStorage.setItem(TAGS_IGNORED, tags)
    }
  }

  function langFromHostname(url: string | undefined): string {
    if (url) {
      try {
        const hostname = new URL(url).hostname
        return hostname.split('.')[hostname.split('.').length - 1] || 'en'
      } catch (e) {
        return 'en'
      }
    }
    return 'en'
  }

  const analyse = async (
    metas: object,
    article: object | undefined,
    tabReferences: TabReference[],
    url: string | undefined,
  ): Promise<TagInfo[]> => {
    function pushTagsInfo() {
      return (ti: TagInfo) => tagsInfo.push(ti)
    }

    console.log(' <> Starting Tags Analysis...')
    const tagsInfo: TagInfo[] = []
    let description: string = metas['description' as keyof object] || '' //alternatives?
    let text = description
    if (article && article['content' as keyof object]) {
      const textTokens = ContentUtils.html2text(article['content' as keyof object])

      const tokens = textTokens.split(' ')
      //console.log('got token', tokens)
      let res = ''
      const tokenSet = new Set()
      tokens.forEach((t: string) => {
        if (t.length >= 4 && t.length <= 24) {
          res += t + ' '
          tokenSet.add(t.toLowerCase())
        }
      })
      // // console.log("got token2", tokenSet)
      // return tokenSet

      text = Array.from(tokenSet).join(' ')
    }

    tagsFromReferences(tabReferences).forEach(pushTagsInfo())

    if (metas['keywords' as keyof object]) {
      tagsFromKeywords(metas['keywords' as keyof object] as string).forEach(pushTagsInfo())
    }

    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      tagsFromHierarchy(currentTabset).forEach(pushTagsInfo())
    }

    // language
    let language = langFromHostname(url)
    let confidence = 0
    if (useFeaturesStore().hasFeature(FeatureIdent.AI) && text && text.trim().length > 10) {
      try {
        console.log(' <> hier!')
        // @ts-expect-error xxx
        const detector: any = await LanguageDetector.create() //.then((detector: any) => {
        const results: any[] = await detector.detect(text) //.then((results: any[]) => {
        if (results.length > 0) {
          language = results[0].detectedLanguage
          confidence = results[0].confidence || 0
          tagsFromLangDetection(language, confidence).forEach(pushTagsInfo())
        }
      } catch (e) {}
    }

    if (url) {
      tagsFromUrl(url, language).forEach(pushTagsInfo())
    }
    if (text) {
      tagsFromLanguageModel(text, language, 'languageModel').forEach(pushTagsInfo())
    }

    const r = await useCategorizationService().categorize(text)
    console.log('r', r)

    console.log(' <> overall result', tagsInfo)
    const deduplicated = deduplicateTags(tagsInfo)
    console.log(' <> overall result', deduplicated)
    return deduplicated
  }

  function getCurrentTabCategory(): TabCategory {
    const tags = useContentStore().currentTabTags

    function linkindDataRefersTo(labelVal: string) {
      return tags.filter((t: TagInfo) => t.type === 'linkingData' && t.label === labelVal).length > 0
    }

    if (linkindDataRefersTo('Recipe')) {
      return 'recipe'
    }
    if (linkindDataRefersTo('NewsArticle')) {
      return 'news'
    }
    if (linkindDataRefersTo('Product')) {
      return 'shopping'
    }
    // if (useFeaturesStore().hasFeature(FeatureIdent.AI)) {
    //   const text = useContentStore().getCurrentTabContent
    //   console.log(' <> analysing', text)
    //   if (text) {
    //     // const res = await useCategoriesService().categorize(text)
    //     const res = catService.categorize(text)
    //     console.log('res', res)
    //   }
    // }
    return 'uncategorized'
  }

  return {
    deduplicateTags,
    tagsFromKeywords,
    tagsFromHierarchy,
    tagsFromUrl,
    tagsFromClassification,
    tagsFromLangDetection,
    tagsFromLanguageModel,
    getDynamicTabsBy,
    addToIgnored,
    analyse,
    getCurrentTabCategory,
  }
}
