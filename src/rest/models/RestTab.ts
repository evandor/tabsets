import BrowserApi from 'src/app/BrowserApi'
import { RestApiIdent } from 'src/rest/RestApi'
import { Tab } from 'src/tabsets/models/Tab'

export interface RestParam {
  name: string
  type: string
  condition?: string
  val: any
}

export class RestTab extends Tab {
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
}
