import {defineStore} from 'pinia';
import Fuse from 'fuse.js'
import FuseIndex = Fuse.FuseIndex;
import TabsetService from "src/services/TabsetService";

export const useSearchStore = defineStore('search', {
  state: () => ({

    term: null as unknown as string,

    history: [] as unknown as string[],

    searchIndex: null as unknown as any,

    fuse: null as unknown as any,

    options: {
      keys: [{name:'name', weight:10}, {name:'title', weight:5}, {name:'url', weight:2}, {name:'description', weight:3}, {name:'content', weight:1}],
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 3
    }

  }),

  getters: {},

  actions: {
    async init() {

      this.searchIndex = Fuse.createIndex(this.options.keys, [])
      this.fuse = new Fuse([], this.options, this.searchIndex)

    },
    addToIndex(id: string, name: string, title: string, url: string, description: string, content: string, tabsets: string[], favIconUrl: string):number {
      const doc = {
        id, name, title, url, description, content, tabsets, favIconUrl
      }
      const indexLength = this.fuse.getIndex().size()
      console.log("adding to index: ", indexLength, doc)
      this.fuse.add(doc)
      return indexLength
    },
    updateDescription(id: number, description: string) {
      const entries: any[] = this.fuse.remove((doc:any) => {doc.id === id})
      console.log("updating description", entries)
      if (entries && entries.length > 0) {
        const old = entries[0]
        this.addToIndex(old.id, old.name, old.title, old.url, description, old.content, old.tabsets, old.favIconUrl)
      }
    },
    populate(contentPromise: Promise<any[]>) {
      console.log("populating searchstore...")
      contentPromise
        .then(content => {
          //console.log("savedContent", content)
          this.searchIndex = Fuse.createIndex(this.options.keys, content)
          this.fuse = new Fuse(content, this.options, this.searchIndex)
          //console.log("index size", this.fuse.getIndex().size())
        })

    }

  }
});
