import Command from 'src/core/domain/Command'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import Analytics from 'src/core/utils/google-analytics'
import { useSearchStore } from 'src/search/stores/searchStore'
import { Tab, UrlExtension } from 'src/tabsets/models/Tab'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import PlaceholderUtils from 'src/tabsets/utils/PlaceholderUtils'
import { ListDetailLevel } from 'src/ui/stores/uiStore'

function setUrl(
  tab: Tab,
  url: string,
  placeholders: string[] = [],
  placeholderValues: Map<string, string> = new Map(),
  extension: UrlExtension = UrlExtension.HTML,
): Promise<any> {
  tab.url = url
  tab.extension = extension
  tab = PlaceholderUtils.apply(tab, placeholders, placeholderValues)
  return useTabsetService().saveCurrentTabset()
}

function setCustomTitle(tab: Tab, title: string, desc: string): Promise<any> {
  tab.name = title
  tab.longDescription = desc
  return useTabsetService().saveCurrentTabset()
}

class UndoCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public oldUrl: string,
    public oldDetails: ListDetailLevel,
  ) {}

  execute(): Promise<ExecutionResult<any>> {
    console.info(this.tab, `reverting changed tab url to ${this.oldUrl}`)
    this.tab.details = this.oldDetails
    return setUrl(this.tab, this.oldUrl)
      .then((res) => {
        Analytics.fireEvent('tabset_tab_updated', {})
        if (this.tab.url) {
          useSearchStore().update(this.tab.url, 'url', this.oldUrl)
        }
        return res
      })
      .then((res) => new ExecutionResult(res, 'Tab change was undone'))
  }
}

export class UpdateTabCommand implements Command<any> {
  constructor(
    public tab: Tab,
    public newUrl: string,
    public newName: string,
    public newDesc: string,
    public details: ListDetailLevel = 'DEFAULT',
    public placeholders: string[] = [],
    public placeholderValues: Map<string, string> = new Map(),
    public extension: UrlExtension = UrlExtension.HTML,
  ) {}

  async execute(): Promise<ExecutionResult<string>> {
    const oldUrl = this.tab.url || ''
    const oldDetails = this.tab.details
    this.tab.details = this.details
    await setCustomTitle(this.tab, this.newName, this.newDesc)
    return setUrl(this.tab, this.newUrl, this.placeholders, this.placeholderValues, this.extension)
      .then((ignored) => {
        if (this.tab.url) {
          useSearchStore().update(this.tab.url, 'url', this.newUrl)
        }
      })
      .then((ignored) =>
        Promise.resolve(
          new ExecutionResult(
            this.newUrl,
            'Tab updated',
            new Map([['Undo', new UndoCommand(this.tab, oldUrl, oldDetails)]]),
          ),
        ),
      )
      .catch((err) => Promise.reject(err))
  }
}

UpdateTabCommand.prototype.toString = function cmdToString() {
  return `UpdateTabNameCommand: {tabId=${this.tab.id}, newUrl=${this.newUrl}, placeholders=${this.placeholders.toString()}, placeholderValues=${JSON.stringify(this.placeholderValues)}}`
}
