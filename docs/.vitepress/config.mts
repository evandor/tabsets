import { defineConfig } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
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
    ignoreDeadLinks: true,
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
            { text: 'Tabsets', link: 'docs/submodules/tabsets' },
            { text: 'Bookmarks', link: 'docs/submodules/bookmarks' },
            { text: 'Features', link: 'docs/submodules/features' },
            { text: 'Search', link: 'docs/submodules/search' },
            { text: 'Snapshots', link: 'docs/submodules/snapshots' }
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

// export default withMermaid({
//   // your existing vitepress config...
//   // optionally, you can pass MermaidConfig
//   mermaid: {
//     // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
//   },
//   // optionally set additional config for plugin itself with MermaidPluginConfig
//   mermaidPlugin: {
//     class: "mermaid my-class", // set additional css classes for parent container
//   },
// });
