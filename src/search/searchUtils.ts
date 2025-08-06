import * as E from 'fp-ts/lib/Either'
import Fuse from 'fuse.js'
import { uid } from 'quasar'
import { ContentItem } from 'src/content/models/ContentItem'
import { TagInfo } from 'src/core/models/TagInfo'
import { SearchDoc } from 'src/search/models/SearchDoc'
import { Tab } from 'src/tabsets/models/Tab'

function overwrite(ident: string, doc: SearchDoc, removed: SearchDoc[]) {
  if (!doc[ident as keyof object]) {
    // console.log('overwriting', ident, doc, removed)
    doc[ident as keyof object] = removed[0]![ident as keyof object]
  }
}

export function searchUtils() {
  const objectToSearchDoc = (o: Object): E.Either<string, SearchDoc> => {
    const parsed = JSON.parse(JSON.stringify(o))
    // console.log('objectToSearchDoc', parsed)
    const doc: SearchDoc = Object.assign(new SearchDoc(uid(), '', '', '', '', '', '', '', [], '', 'zzz'), parsed)
    if (!doc.url) {
      return E.left('object to be added to search index does not have an URL field set.')
    }
    return E.right(doc)
  }

  const overwriteIfReplacing = (fuse: Fuse<SearchDoc>, doc: SearchDoc): SearchDoc => {
    const removed = fuse.remove((d: any) => {
      return d.url === doc.url
    })
    if (removed && removed[0]) {
      overwrite('name', doc, removed)
      overwrite('description', doc, removed)
      overwrite('keywords', doc, removed)
      overwrite('content', doc, removed)
      overwrite('tags', doc, removed)
    }
    return doc
  }
  const searchDocFrom = (tab: Tab, content: ContentItem) => {
    return new SearchDoc(
      uid(),
      tab.name || '',
      tab.title || '',
      tab.url || '',
      tab.description,
      tab.keywords,
      content.content || '',
      tab.favIconUrl || '',
      [],
      'Tab',
      tab.tagsInfo ? tab.tagsInfo.map((tag: TagInfo) => tag.label).join(' ') : '',
    )
    //     tabsets: [tabset.id],
  }
  return {
    objectToSearchDoc,
    overwriteIfReplacing,
    searchDocFrom,
  }
}
