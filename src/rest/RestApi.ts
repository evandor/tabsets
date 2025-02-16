import { RestParam } from 'src/rest/models/RestTab'
import { Tabset } from 'src/tabsets/models/Tabset'

export type RestApiIdent = 'OBSIDIAN' | 'RAPID_API_WEBSITE_CATEGORIZATION'

export class RestApi {
  constructor(
    public ident: string,
    public fetchTabset: (context: { browserTab?: chrome.tabs.Tab }) => Promise<Tabset>,
    public get: (params: RestParam[]) => any,
  ) {}
}
