import {Tabset} from "src/tabsets/models/Tabset";

export class NewOrReplacedTabset {


  constructor(public replaced: boolean, public tabset: Tabset) {
    this.replaced = replaced
    this.tabset = tabset
  }

}
