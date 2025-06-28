import _ from 'lodash'
import { ContentBlock } from './frontend'

export class Page {
  id: string
  name: string
  tabsetId: string
  version: number
  created: number
  changed: number
  published: number
  elements: ContentBlock[]
  redirectTo: string

  constructor(
    id: string,
    name: string,
    tabsetId: string,
    version: number,
    created: number,
    changed: number,
    published: number,
    elements: ContentBlock[],
    redirectTo?: string,
  ) {
    this.id = id
    this.name = name
    this.tabsetId = tabsetId
    this.elements = elements
    this.version = version
    this.created = created
    this.changed = changed
    this.published = published
    this.redirectTo = redirectTo || (null as unknown as string)
  }
}

export class Nav {
  id: string
  originalOrder: number
  currentOrder: number

  constructor(id: string, originalOrder: number, currentOrder: number) {
    this.id = id
    this.originalOrder = originalOrder
    this.currentOrder = currentOrder
  }
}

export class MainColors {
  primary = '#1976d2'
  secondary = '#26a69a'
  accent = '#9c27b0'
  dark = '#1d1d1d'
  positive = '#21ba45'
  negative = '#c10015'
  info = '#31ccec'
  warning = '#f2c037'
}

export class Flex {
  container: string
  direction: string
  justifyContent: string
  wrap: string
  alignItems: string
  alignContent: string
  padding: string
  margin: string
  border: string
  maxWidth: string // issues with "number" in website-nav ?!
  noMaxWidth: string
  marginLeft: string
  marginRight: string
  marginLeftAuto: string
  marginRightAuto: string

  constructor(
    container: string,
    direction: string,
    justifyContent: string,
    wrap: string,
    alignItems: string,
    alignContent: string,
    padding?: string,
    margin?: string,
    border?: string,
    maxWidth?: string,
    noMaxWidth?: string,
    marginLeft?: string,
    marginRight?: string,
    marginLeftAuto?: string,
    marginRightAuto?: string,
  ) {
    this.container = container
    this.direction = direction
    this.justifyContent = justifyContent
    this.wrap = wrap
    this.alignItems = alignItems
    this.alignContent = alignContent
    this.padding = padding || ''
    this.margin = margin || ''
    this.border = border || ''
    this.maxWidth = maxWidth || '1024'
    this.noMaxWidth = noMaxWidth || 'true'
    this.marginLeft = marginLeft || '0px'
    this.marginRight = marginRight || '0px'
    this.marginLeftAuto = marginLeftAuto || 'false'
    this.marginRightAuto = marginRightAuto || 'false'
  }
}

export class Website {
  id: string
  name: string
  livesite: string
  title: string
  internalName: string
  draftFlex: Flex = new Flex('fit', 'column', 'justify-center', 'none', 'items-center', 'none')
  private originalPages: Array<Page> = []
  private currentPages: Array<Page> = []
  private navigation: Array<Nav> = []
  private originalFlex: Flex = new Flex('fit', 'column', 'justify-center', 'none', 'items-center', 'none')

  showFooter: boolean = true
  footerDraft: ContentBlock = null as unknown as ContentBlock
  footer: ContentBlock = null as unknown as ContentBlock

  showHeader: boolean = true
  headerDraft: ContentBlock = null as unknown as ContentBlock
  header: ContentBlock = null as unknown as ContentBlock

  draftColors = new MainColors()
  originalColors = new MainColors()

  bgColor: string = '#ffffff'
  fontColor: string = '#000000'

  bgImg: string = ''

  constructor(
    id: string,
    name: string,
    internalName: string,
    livesite: string,
    title: string,
    draftFlex: Flex,
    draftColors?: MainColors,
    originalColors?: MainColors,
  ) {
    this.id = id
    this.name = name
    this.internalName = internalName
    this.livesite = livesite
    this.title = title
    this.draftFlex = draftFlex
    this.draftColors = draftColors || new MainColors()
    this.originalColors = originalColors || new MainColors()
  }

  setOriginalPages(ps: Array<Page>): void {
    this.originalPages = ps
    this.applyNavigation()
  }

  getOriginalPages(): Array<Page> {
    return this.originalPages
  }

  setCurrentPages(ps: Array<Page>): void {
    this.currentPages = ps
    this.applyNavigation()
  }

  getCurrentPages(): Array<Page> {
    return this.currentPages
  }

  setNavigation(nav: Array<Nav>): void {
    console.log('setting navigation', nav)
    this.navigation = nav
    this.applyNavigation()
  }

  navigationIsDirty(): boolean {
    // console.log("1", _.map(this.navigation, n => n.originalOrder))
    // console.log("2", _.map(this.navigation, n => n.currentOrder))
    // console.log("3", _.map(this.navigation, n => n.originalOrder) !== _.map(this.navigation, n => n.currentOrder))
    return (
      JSON.stringify(_.map(this.navigation, (n: Nav) => n.originalOrder)) !==
      JSON.stringify(_.map(this.navigation, (n: Nav) => n.currentOrder))
    )
  }

  setOriginalFlex(f: Flex) {
    this.originalFlex = f
  }

  getOriginalFlex() {
    return this.originalFlex
  }

  private applyNavigation() {
    //console.log("this.navigation", this.navigation)
    if (this.navigation) {
      const originalNav = _.map(_.orderBy(this.navigation, 'originalOrder'), (n: Nav) => n.id)
      this.originalPages.sort((a, b) => originalNav.indexOf(a.id) - originalNav.indexOf(b.id))
      const currentNav = _.map(_.orderBy(this.navigation, 'currentOrder'), (n: Nav) => n.id)
      this.currentPages.sort((a, b) => currentNav.indexOf(a.id) - currentNav.indexOf(b.id))
    }
  }
}

export class WebsiteAndId {
  id: string
  website: Website

  constructor(id: string, website: Website) {
    this.id = id
    this.website = website
  }
}

export class Image {
  date: number
  imageUrl: string
  id: string
  selected: boolean
  name = ''
  width = 0
  height = 0

  constructor(id: string, imageUrl: string, date: number, selected: boolean) {
    this.id = id
    this.imageUrl = imageUrl
    this.date = date
    this.selected = selected
  }
}

export class Template extends Website {
  isPublic = false
  copyright = ''
}
