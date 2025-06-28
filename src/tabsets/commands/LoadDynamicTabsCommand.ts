import * as cheerio from 'cheerio'
import { Parent, Root, RootContent, Text } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { uid } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import Command from 'src/core/domain/Command'
import { ExecutionFailureResult, ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { CreateFolderCommand } from 'src/tabsets/commands/CreateFolderCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'

class TabNode {
  constructor(
    public text: string,
    public url: string,
    public description?: string,
    public dynamicUrl?: string,
  ) {}
}

class FolderNode {
  constructor(
    public name: string,
    public id: string,
    public children: FolderNode[] = [],
    public tabs: TabNode[] = [],
  ) {}
}

export class LoadDynamicTabsCommand implements Command<any> {
  public merge: boolean = true

  constructor(
    private tabset: Tabset,
    private dynamicUrl: string,
  ) {}

  async execute(): Promise<ExecutionResult<any>> {
    let currentHeadings: string[] = ['', '', '', '', '', '', '', '', '', '', '', '', '']

    function visitChildren(c: Parent, links: object[]): object[] {
      //console.log("checking", typeof c, c)
      if (c.type === 'heading') {
        var t = c.children.filter((c: RootContent) => c.type === 'text').map((c: Text) => c.value || 'no title')
        if (t.length > 0) {
          //currentHeading = t[0]
          console.log('testing header:', t[0], c['depth' as keyof object])
          currentHeadings[c['depth' as keyof object]] = t[0]!
        }
      } else if (c.type === 'paragraph') {
        if (c.children) {
          const linkChildren = c.children.filter((c) => c.type === 'link')
          const descriptions = c.children.filter((c) => c.type === 'text')
          //console.log("found", linkChildren, descriptions, linkChildren.length > 0 && descriptions.length > 0)
          if (linkChildren.length > 0 && descriptions.length > 0) {
            const texts: string[] = linkChildren[0]!.children
              .filter((c: RootContent) => c.type === 'text') // "links" -> "text"
              .map((c: Text) => c.value || 'no title')
            const description = descriptions[0]!.value
            const res = {
              url: linkChildren[0]!['url' as keyof object] as string,
              text: texts.length > 0 ? texts[0] : 'no title2',
              description: description,
              headings: currentHeadings.filter((h) => h.trim().length > 0),
            }
            //console.log("res", res)
            links.push(res)
          }
        }
      } else {
        if (c.children) {
          c.children.map((child: RootContent) => visitChildren(child as Parent, links))
        }
      }
      return links
    }

    function analyzse(node: Root, links: object[] = []) {
      console.log(`type ${node.type}, children# ${node.children.length}`)
      node.children.map((c: RootContent) => visitChildren(c as Parent, links))
      return links
    }

    function createFolderIfNotExisting(headings: string[], headingMapping: Map<string, FolderNode>) {
      //console.log("createFolderIfNotExisting", headings, headingMapping)
      const parentPath = headings.length > 0 ? headings.slice(0, headings.length - 1) : ['']
      const parent = headingMapping.get(parentPath.join('->')) // assuming always found
      const headingsPath = headings.join('->')
      if (!headingMapping.has(headingsPath)) {
        const newFolder = new FolderNode(headings[headings.length - 1]!, uid())
        headingMapping.set(headingsPath, newFolder)
        parent!.children.push(newFolder)
      }
    }

    async function createFolders(parentNode: FolderNode, tabsetId: string, parentFolder: string) {
      console.log('creating folders ---', parentNode, tabsetId, parentFolder)
      for (const child of parentNode.children) {
        const tabs: Tab[] = child.tabs.map((t: TabNode) => {
          const tab: Tab = new Tab(uid(), BrowserApi.createChromeTabObject(t.text, t.url))
          tab.description = t.description || ''
          tab.tags = ['markdown import']
          tab.tabReferences.push(new TabReference(uid(), TabReferenceType.SOURCE, 'original URL', [], t.dynamicUrl))
          return tab
        })
        await useCommandExecutor().executeFromUi(
          new CreateFolderCommand(uid(), child.name, tabs, tabsetId, parentFolder),
        )
      }
    }

    //const folderOrTabset: Tabset = this.folder ? this.folder : this.tabset
    if (this.dynamicUrl.endsWith('.md')) {
      const doc = await fetch(this.dynamicUrl)
      const body = await doc.text()
      const tree: Root = fromMarkdown(body)
      // console.log("tree", JSON.stringify(tree, null, 2))

      // cleanup
      const onlyLinkTree = analyzse(tree)

      console.log('onlyLinkTree', JSON.stringify(onlyLinkTree, null, 2))

      const rootFolder: FolderNode = new FolderNode('root', uid())
      const headingMapping: Map<string, FolderNode> = new Map()
      headingMapping.set('', rootFolder)

      onlyLinkTree.forEach((e: object) => {
        const headings = e['headings' as keyof object] as string[]
        const headingsPath = headings.join('->')
        // console.log("got headingsPath", headingsPath)
        if (headingMapping.has(headingsPath)) {
        } else {
          for (let i = 0; i <= headings.length; i++) {
            //console.log("testing", headings, i)
            createFolderIfNotExisting(headings.slice(0, i), headingMapping)
          }
        }
      })

      console.log('rootFolder', rootFolder)

      onlyLinkTree.forEach((e: object) => {
        const tab = new Tab(
          uid(),
          BrowserApi.createChromeTabObject(e['text' as keyof object], e['url' as keyof object]),
        )
        tab.description = e['description' as keyof object]
        //tab.date = new Date().getTime()
        tab.tags = ['markdown import']
        tab.tabReferences.push(new TabReference(uid(), TabReferenceType.SOURCE, 'original URL', [], this.dynamicUrl))

        const headingsPath = (e['headings' as keyof object] as string[]).join('->')
        if (headingMapping.has(headingsPath)) {
          const folder = headingMapping.get(headingsPath)!
          folder.tabs.push(
            new TabNode(
              e['text' as keyof object],
              e['url' as keyof object],
              e['description' as keyof object],
              this.dynamicUrl,
            ),
          )
        }
      })

      const mainFolderResult: ExecutionResult<Tabset> = await useCommandExecutor().executeFromUi(
        new CreateFolderCommand(uid(), 'Extracted Links', [], this.tabset.id, undefined, this.dynamicUrl),
      )
      await createFolders(rootFolder, this.tabset.id, mainFolderResult.result.id)

      // const mainFolderResult = await useCommandExecutor().executeFromUi(new CreateFolderCommand(uid(), "Extracted Links", tabs, this.tabset.id, undefined, this.dynamicUrl))
      // const mainFolder = mainFolderResult.result as Tabset
      //
      //
      // await useTabsetService().saveTabset(this.tabset)

      return Promise.resolve(new ExecutionResult('', ''))
    } else if (this.dynamicUrl.endsWith('.rss')) {
      return Promise.resolve(new ExecutionResult('', 'xxx'))
    } else if (this.dynamicUrl.startsWith('https://www.youtube.com/watch')) {
      const doc = await fetch(this.dynamicUrl)
      const body = await doc.text()
      console.log('body', body)
      const $ = cheerio.load(body)
      // #description-inline-expander
      //  const segment = $('#description-inline-expander')
      //  console.log("segment", segment)
      //  for (const elem of segment._findBySelector('a',100)) {
      //    console.log("elem", elem)
      //  }
      const links = $('#description-inline-expander a')
      console.log('links', links)
      // const t = new Tab(uid(), ChromeApi.createChromeTabObject(heading + ": " + title, n.url, ""))
      // this.tabset.tabs.push(t)

      return Promise.resolve(new ExecutionResult('', 'xxx'))
    } else {
      return Promise.resolve(new ExecutionFailureResult('', "must be a markdown, rss or a youtube 'watch' link"))
    }
  }
}

// LoadDynamicTabsCommand.prototype.toString = function cmdToString() {
//   return `LoadDynamicTabsCommand: tabsetId=${this.tabset.id}, dynamicUrl=${dynamicUrl}}`;
// };
