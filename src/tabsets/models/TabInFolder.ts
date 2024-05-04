import {Tab} from "src/tabsets/models/Tab";
import {Tabset} from "src/tabsets/models/Tabset";

export class TabInFolder {
  constructor(public tab:Tab, public folder: Tabset) {
  }
}
