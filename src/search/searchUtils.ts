import * as E from 'fp-ts/lib/Either'
import Fuse from 'fuse.js'
import { uid } from 'quasar'
import { SearchDoc } from 'src/search/models/SearchDoc'

function overwrite(ident: string, doc: SearchDoc, removed: SearchDoc[]) {
  if (!doc[ident as keyof object]) {
    console.log('overwriting', ident, doc, removed)
    doc[ident as keyof object] = removed[0]![ident as keyof object]
  }
}

export function searchUtils() {
  const objectToSearchDoc = (o: Object): E.Either<string, SearchDoc> => {
    const parsed = JSON.parse(JSON.stringify(o))
    console.log('objectToSearchDoc', parsed)
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
  return {
    objectToSearchDoc,
    overwriteIfReplacing,
  }
}
