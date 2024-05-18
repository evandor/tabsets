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
      { text: 'Install as Extension', link: 'https://docs.tabsets.net/installation' },
      { text: 'User Documentation', link: 'https://docs.tabsets.net' }
    ],

    sidebar: {
      '/docs/submodules/': [
        {
          text: 'Tabsets',
          items: [
            { text: 'Home', link: '/' },
          ]
        },
        {
          text: 'Submodules',
          items: [
            { text: 'Bookmarks', link: 'docs/submodules/bookmarks' },
            { text: 'Features', link: 'docs/submodules/features' },
          ]
        }
      ],

      '/config/': [
        {
          text: 'Config',
          items: [
            { text: 'Index', link: '/config/' },
            { text: 'Three', link: '/config/three' },
            { text: 'Four', link: '/config/four' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/evandor/tabsets' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2021-PRESENT Skysail Consulting',
    },
  }
})
