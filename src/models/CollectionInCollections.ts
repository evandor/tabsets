import {Tabset} from "src/models/Tabset";
import {Collection} from "src/models/Collection";

export class CollectionInCollections {


  constructor(public collection: Collection, public collections: Map<string, Collection>) {
    this.collection = collection
    this.collections = collections
  }

}
