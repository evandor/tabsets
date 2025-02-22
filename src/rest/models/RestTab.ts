import BrowserApi from 'src/app/BrowserApi'
import { RestApiIdent } from 'src/rest/RestApi'
import { Tab } from 'src/tabsets/models/Tab'

export interface RestParam {
  name: string
  type: string
  condition?: string
  val: any
}

export type ParamTemplateKeyValue = [string, string | number | boolean]

export class RestTab extends Tab {
  // paramsTemplates: [string, ParamTemplateKeyValue[]][] = []
  // paramsTemplates: Record<string, ParamTemplateKeyValue[]> = {}
  paramsTemplates: { [k: string]: ParamTemplateKeyValue[] } = {}

  layout: object = {}

  constructor(
    override id: string,
    override title: string,
    override url: string,
    public api: RestApiIdent,
    public host: string,
    public route: string,
    public method: string,
    public headers: [string, string][] = [],
    public params: RestParam[] = [],
  ) {
    super(id, BrowserApi.createChromeTabObject(title, url))
  }

  addParamsTemplate(key: string, val: ParamTemplateKeyValue[]) {
    // if (!this.paramsTemplates) {
    //   this.paramsTemplates = []
    // }
    console.log('---', this.paramsTemplates)
    // this.paramsTemplates.push([key, val])
    this.paramsTemplates[key] = val
  }
}
