import {Tab} from "src/models/Tab";
import {Group} from "src/models/Group";
import {Space} from "src/models/Space";

export class MHtml {
  created: number
  updated: number

  constructor(public id: string, public title: string, public favIconUrl: string) {
    this.created = new Date().getTime()
    this.updated = new Date().getTime()
  }

}
