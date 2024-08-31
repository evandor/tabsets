import { defineConfig } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Tabsets.net",
  description: "description site",
  base: '/tabsets/', // needed for github pages
  srcDir: '../', // need to place the main index.md file on top to be able to reference relative paths
  ignoreDeadLinks: true,
  // rewrites: {
  //   '../src/tabsets/doc/usage.md': 'pkg-a/index.md'
  // },
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
            { text: 'Bookmarks', link: 'docs/submodules/bookmarks' },
            { text: 'Content', collapsed: true, items: [
                {text: 'Home', link: 'docs/submodules/content'},
                {text: 'Installation', link: 'docs/submodules/build/content/installation'},
                {text: 'Setup', link: 'docs/submodules/build/content/setup'},
                {text: 'Usage', link: 'docs/submodules/build/content/usage'},
              ] },
            { text: 'Features', link: 'docs/submodules/features' },
            { text: 'Snapshots', link: 'docs/submodules/snapshots' },
            { text: 'Search', link: 'docs/submodules/search' },
            { text: 'Tabsets', link: 'docs/submodules/tabsets' },
            { text: 'Thumbnails', collapsed: true, items: [
                {text: 'Home', link: 'docs/submodules/thumbnails'},
                {text: 'Installation', link: 'docs/submodules/build/thumbnails/installation'},
                {text: 'Setup', link: 'docs/submodules/build/thumbnails/setup'},
                {text: 'Usage', link: 'docs/submodules/build/thumbnails/usage'},
              ] },
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
