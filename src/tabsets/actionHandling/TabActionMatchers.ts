import { QVueGlobals } from 'quasar'
import { DefaultTabActionMatcher } from 'src/tabsets/actionHandling/handler/DefaultTabActionMatcher'
import { ExcalidrawAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ExcalidrawAddUrlToTabsetHandler'
import { FileProtocolUrlAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/FileProtocolUrlAddUrlToTabsetHandler'
import { ImportFromChromeBookmarksManagerAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ImportFromChromeBookmarksManagerAddUrlToTabsetHandler'
import { MarkdownFileAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/MarkdownFileAddUrlToTabsetHandler'
import { ObsidianApiAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/ObsidianApiAddUrlToTabsetHandler'
import { PublicTabsetsTabActionMatcher } from 'src/tabsets/actionHandling/handler/PublicTabsetsTabActionMatcher'
import { RapidApiAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/RapidApiAddUrlToTabsetHandler'
import { RssUrlAddUrlToTabsetHandler } from 'src/tabsets/actionHandling/handler/RssUrlAddUrlToTabsetHandler'
import { TabActionMatcher } from 'src/tabsets/actionHandling/TabActionMatcher'
import { Tabset } from 'src/tabsets/models/Tabset'

export class TabActionMatchers {
  defaultAddUrlToTabsetHandler = new DefaultTabActionMatcher(null as unknown as QVueGlobals)

  handlers: TabActionMatcher[] = []

  constructor(public quasar: QVueGlobals | undefined) {
    // this.handlers.push(new DynamicUrlAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new ExcalidrawAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new ObsidianApiAddUrlToTabsetHandler())
    this.handlers.push(new RapidApiAddUrlToTabsetHandler(this.quasar!))
    this.handlers.push(new MarkdownFileAddUrlToTabsetHandler(this.quasar!))
    this.handlers.push(new ImportFromChromeBookmarksManagerAddUrlToTabsetHandler(this.quasar!))
    this.handlers.push(new RssUrlAddUrlToTabsetHandler(this.quasar!))
    this.handlers.push(new PublicTabsetsTabActionMatcher(this.quasar!))
    // this.handlers.push(new TtlUrlAddUrlToTabsetHandler(this.quasar))
    this.handlers.push(new FileProtocolUrlAddUrlToTabsetHandler(this.quasar))
  }

  handlerFor(url: string, content: string, metas: object = {}, folder?: Tabset): TabActionMatcher {
    //console.log(`checking handler for ${url}`, metas, content.length)
    const handler = this.handlers.filter(
      // (h: ActionMatcher) => url.match(h.urlMatcher()) || h.contentMatcher(content) || h.metasMatcher(metas),
      (h: TabActionMatcher) => h.tabMatcher(url, content, metas),
    )
    if (handler && handler.length > 0) {
      //console.log('chosen', handler[0])
      //handler[0].setFolder(folder)
      //if (!this.injectedUrls.includes(url)) {
      //console.log('injecting to url', url)
      //await handler[0]!.injectScript()
      //this.injectedUrls.push(url)
      //}
      return handler[0]!
    }
    return new DefaultTabActionMatcher(this.quasar!)
  }
}
