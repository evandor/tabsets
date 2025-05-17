import { defineBoot } from '#q-app/wrappers'
import CmsBanner from 'src/custompages/components/cms-banner.vue'
import CmsHeading from 'src/custompages/components/cms-heading.vue'
import CmsList from 'src/custompages/components/cms-list.vue'
import CmsText from 'src/custompages/components/cms-text.vue'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli-vite/boot-files
export default defineBoot(async ({ app } /* { app, router, ... } */) => {
  // something to do
  app.component('CmsHeading', CmsHeading)
  // app.component('CmsSpan', CmsSpan)
  app.component('CmsText', CmsText)
  // app.component('component-list',  ComponentList)
  app.component('CmsList', CmsList)
  app.component('CmsBanner', CmsBanner)
  // app.component('ComponentHtml',  ComponentHtml)
  // app.component('ComponentHeading',  ComponentHeading)
  // app.component('CmsLink',  CmsLink)
  // app.component('CmsHeading',  CmsHeading)
  // app.component('CmsColumns',  CmsColumns)
  // app.component('CmsRows',  CmsRows)
  // app.component('CmsImg',  CmsImg)
  // app.component('CmsParagraph',  CmsParagraph)
  // app.component('CmsParallax',  CmsParallax)
  // app.component('CmsRevealjs',  CmsRevealjs)
  // app.component('CmsDroptarget',  CmsDroptarget)
  // app.component('CmsMainMenu',  CmsMainMenu)
  // app.component('CmsFooter',  CmsFooter)
  // app.component('CmsSection',  CmsSection)
  // app.component('CmsRuler',  CmsRuler)
  // app.component('CmsRssFeed',  CmsRssFeed)
  // app.component('CmsTwitterTimeline',  CmsTwitterTimeline)
  // app.component('CmsOpenhabApi',  CmsOpenhabApi)
  // app.component('CmsMarkdown',  CmsMarkdown)
  // app.component('CmsTable',  CmsTable)
  //
  // app.component('CmsContentMenu',  CmsContentMenu)
  // app.component('CmsDraggable',  CmsDraggable)
})
