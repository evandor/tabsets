import { TAGS_IGNORED } from 'boot/constants'
import nlp from 'compromise'
import speech from 'compromise-speech'
import stats from 'compromise-stats'
// @ts-expect-error xxx
import nlpDE from 'de-compromise'
import _ from 'lodash'
import { LocalStorage } from 'quasar'
import { CategoryInfo, TagInfo, TagType } from 'src/core/models/TagInfo'
import { useUtils } from 'src/core/services/Utils'
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
    console.log('tagsFromKeywords', keywordsString)
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
    return keywords.map((k: string) => {
      return { label: sanitizeContent(k.trim()), type: 'keyword', score: 1 }
    })
  }

  const tagsFromHierarchy = (ts: Tabset): TagInfo[] => {
    const folderChain = useTabsetsStore().getFolderNameChain(ts, ts.folderActive || ts.id)
    const hierarchies: TagInfo[] = folderChain
      .map((name: string) => sanitizeContent(name.replaceAll(' ', '').trim().toLowerCase()))
      .map((name: string) => {
        return { label: sanitizeContent(name), type: 'hierarchy', score: 1 }
      })
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
      console.log('checking path', theURL.pathname)
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
    console.log('result', result)
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
    let doc = null
    console.log('>>>', text, language)
    switch (language) {
      case 'de':
        console.log('using german')
        nlpDE.plugin(speech)
        nlpDE.plugin(stats)
        doc = nlpDE(text)
        doc.compute('syllables') //kaboom
        console.log('===>', doc.json({ syllables: true }))
        console.log('===>', doc.compute('tfidf').json())

        return sanitizeContent(doc.match('[#Noun+]', 0).text())
          .split(' ')
          .filter((word: string) => word.trim().length > 0 && word.trim().length < 26)
          .map((word: string) => {
            return { label: word.toLowerCase(), type: 'languageModel', score: 1 }
          })
      default:
        //const nlp = import('compromise')
        console.log('using german')
        nlp.plugin(speech)
        nlp.plugin(stats)
        doc = nlp(text)
        doc.compute('syllables') //kaboom
        //console.log('===>', doc.json({ syllables: true }))
        //console.log('===>', doc.compute('tfidf').json())

        let m = doc.match('[#Noun+]', 0)
        //console.log('===>', m.text())
        const res: TagInfo[] = m
          .text()
          .replace(/[^\w\s]/gi, '')
          .split(' ')
          .filter((word: string) => word.trim().length > 0 && word.trim().length < 26)
          .map((word: string) => {
            return { label: word.toLowerCase(), type: 'languageModel', score: 1 }
          })
        //console.log('res', res)
        return res
    }
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
  }
}
