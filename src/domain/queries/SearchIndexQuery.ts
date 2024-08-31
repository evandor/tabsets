import Query from "src/core/domain/Query";
import {QueryResult} from "src/core/domain/QueryResult";
import _ from "lodash";
import {Hit} from "src/search/models/Hit";
import {uid} from "quasar";
import {useSearchStore} from "src/search/stores/searchStore";
import {Hits} from "src/search/models/Hits";

export class SearchIndexQuery implements Query<Hits> {

  constructor(
    public term: string) {
  }

  query<T>(): Promise<QueryResult<Hits>> {

    const results = useSearchStore().search(this.term, 10)

    const theHits: Hit[] = []
    let count = 0
    let moreHits = false
    _.forEach(results, h => {
      const theHit = new Hit(
        uid(),
        //ChromeApi.createChromeTabObject(h.item.title, h.item.url, h.item.favIconUrl),
        h.item.title,
        h.item.url,
        h.item.favIconUrl,
        0, 0,
        Math.round(100 - (100 * (h?.score || 1))),
        [],//h.item.tabsets,
        [],
        _.map(h['matches' as keyof object], (m: any) => {
          return {
            key: m['key' as keyof object],
            indices: m['indices' as keyof object]
          }
        }),
        h.item.description,
        h.item.keywords
      )
      // if (h.item.bookmarkId) {
      //   theHit.bookmarkId = h.item.bookmarkId
      // }
      count += 1
      if (count < 10) {
        theHits.push(theHit)
      } else {
        moreHits = true
      }
    })
    // console.log("theHits", theHits)
    const r:QueryResult<Hits> = new QueryResult(new Hits(theHits, moreHits), "")
    return Promise.resolve(r)
  }


}
