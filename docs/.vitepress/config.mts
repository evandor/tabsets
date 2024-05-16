import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Tabsets.net",
  description: "description site",
  base: '/tabsets/', // needed for github pages
  srcDir: '../', // need to place the main index.md file on top to be able to reference relative paths
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'User Documentation', link: 'https://docs.tabsets.net' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/evandor/tabsets' }
    ]
  }
})
