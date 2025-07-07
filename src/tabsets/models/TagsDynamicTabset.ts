import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

export class TagsDynamicTabset extends Tabset {
  static getTabs = (val: string): Tab[] => {
    return []
  }
}
