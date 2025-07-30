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
import { CategoryInfo, TagInfo, TagType } from 'src/core/models/TagInfo'
import { useUtils } from 'src/core/services/Utils'
import ContentUtils from 'src/core/utils/ContentUtils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { IndexedTab } from 'src/tabsets/models/IndexedTab'
import { Tab } from 'src/tabsets/models/Tab'
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
  return s.replace(/[^\wäöüßÄÖÜ\s]/gi, '')
}

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

  const tagsFromUrl = (url: any): TagInfo[] => {
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
      theURL.pathname
        .replace('.html', '')
        .split('/')
        .flatMap((path: string) => {
          return path.split('-')
        })
        .flatMap((path: string) => {
          return path.split('_')
        })
        .map((p: string) => p.trim().toLowerCase())
        .map((p: string) => p.replace(/\d/g, '')) // no numbers please
        .filter((p: string) => p.length > 2 && p.length <= 26)
        .forEach((p: string) => {
          result.push({ label: p, type: 'url', score: 1 })
        })
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

  const tagsFromLanguageModel = (text: string, language: string): TagInfo[] => {
    let result: TagInfo[] = []
    console.log(` <> tags from description (${language})`, text.length > 40 ? text.substring(0, 40) + '...' : text)
    let doc: View | undefined = undefined
    switch (language) {
      case 'de':
        console.log(' <> using german')
        nlpDE.plugin(speech)
        nlpDE.plugin(stats)
        doc = nlpDE(text)
        break
      default:
        //const nlp = import('compromise')
        console.log(' %% using default')
        nlp.plugin(speech)
        nlp.plugin(stats)
        // const nlpEx = nlp.extend(stats)
        doc = nlp(text)
    }
    // doc.compute('syllables')
    // console.log(' <> ===>', doc.json({ syllables: true }))
    console.log(' <> ===>1', doc.compute('tfidf').json())

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
    console.log(' <> ===>2', tokenAnalysis)
    // tokenAnalysis.result.forEach((token: any) => {})

    console.log('keys', Object.keys(tokenAnalysis))
    //const terms: TfidfToken[]
    const terms: Term[] = []
    const termList: string[] = []
    Object.keys(tokenAnalysis).forEach((o: any) => {
      console.log('key', tokenAnalysis[o])
      tokenAnalysis[o]['terms'].forEach((term: Term) => {
        console.log('--->', term)
        if (
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
          termList.findIndex((t: string) => t === term.normal) < 0
        ) {
          termList.push(term.normal)
          terms.push(term)
        }
      })
    })
    const sortedTerms = terms.sort((a: Term, b: Term) => b['tfidf'] - a['tfidf'])
    sortedTerms.forEach((t: Term) => {
      console.log('===>', t.normal, t.tfidf)
    })

    const maxTerms = Math.min(10, sortedTerms.length)
    const firstTerms = sortedTerms.slice(0, maxTerms)
    return firstTerms.map((t: Term) => {
      return { label: t.normal, type: 'languageModel', score: t.tfidf }
    })
    // result = sanitizeContent(doc.match('[#Noun+]', 0).text())
    //   .split(' ')
    //   .filter((word: string) => word.trim().length > 0 && word.trim().length < 26)
    //   .map((word: string) => {
    //     return { label: word.toLowerCase(), type: 'languageModel', score: 1 }
    //   })
    // console.log(' <> reuslt', result)
    //return result
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

  const analyse = async (metas: object, article: object | undefined, url: string | undefined): Promise<TagInfo[]> => {
    function pushTagsInfo() {
      return (ti: TagInfo) => tagsInfo.push(ti)
    }

    console.log(' <> Starting Tags Analysis...')
    const tagsInfo: TagInfo[] = []
    let description: string = metas['description' as keyof object] || '' //alternatives?
    let text = description
    if (article && article['content' as keyof object]) {
      text = ContentUtils.html2text(article['content' as keyof object])
    }

    if (url) {
      tagsFromUrl(url).forEach(pushTagsInfo())
    }

    if (metas['keywords' as keyof object]) {
      tagsFromKeywords(metas['keywords' as keyof object] as string).forEach(pushTagsInfo())
    }

    const currentTabset = useTabsetsStore().getCurrentTabset
    if (currentTabset) {
      tagsFromHierarchy(currentTabset).forEach(pushTagsInfo())
    }

    if (description) {
      console.log(' <> description found')
      if (useFeaturesStore().hasFeature(FeatureIdent.AI) && description && description.trim().length > 10) {
        try {
          console.log(' <> hier!')
          // @ts-expect-error xxx
          const detector: any = await LanguageDetector.create() //.then((detector: any) => {
          const results: any[] = await detector.detect(text) //.then((results: any[]) => {
          if (results.length > 0) {
            var language = results[0].detectedLanguage
            var confidence = results[0].confidence || 0
            tagsFromLangDetection(language, confidence).forEach(pushTagsInfo())
            tagsFromLanguageModel(description, language).forEach(pushTagsInfo())
          }
          // })
          // })
        } catch (e) {
          tagsFromLanguageModel(description, langFromHostname(url)).forEach(pushTagsInfo())
          console.log('error with language detection')
        }
      } else if (description && description.trim().length > 10) {
        tagsFromLanguageModel(description, langFromHostname(url)).forEach(pushTagsInfo())
      }
    }
    const deduplicated = deduplicateTags(tagsInfo)
    console.log(' <> overall result', deduplicated)
    return deduplicated
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
  }
}
