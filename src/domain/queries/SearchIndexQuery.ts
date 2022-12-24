import Query from "src/domain/Query";
import {QueryResult} from "src/domain/QueryResult";
import _ from "lodash";
import {Hit} from "src/models/Hit";
import {uid} from "quasar";
import ChromeApi from "src/services/ChromeApi";
import {useSearchStore} from "stores/searchStore";

export class SearchIndexQuery implements Query<Hit[]> {

  constructor(
    public term: string) {
  }

  query<T>(): Promise<QueryResult<Hit[]>> {

    const results = useSearchStore().search(this.term, 7)

    const theHits: Hit[] = []
    _.forEach(results, h => {
      const theHit = new Hit(
        uid(),
        ChromeApi.createChromeTabObject(h.item.title, h.item.url, h.item.favIconUrl), 0, 0,
        Math.round(100 - (100 * (h?.score || 1))),
        h.item.tabsets,
        _.map(h['matches' as keyof object], (m: any) => {
          return {
            key: m['key' as keyof object],
            indices: m['indices' as keyof object]
          }
        }),
        h.item.description,
        h.item.keywords
      )
      if (h.item.bookmarkId) {
        theHit.bookmarkId = h.item.bookmarkId
      }
      theHits.push(theHit)
    })
    console.log("theHits", theHits)
    const r:QueryResult<Hit[]> = new QueryResult(theHits, "")
    return Promise.resolve(r)
  }


}
