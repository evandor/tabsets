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

    options: {keys: ['title', 'url', 'content']}

  }),

  getters: {

  },

  actions: {
    async init() {

      this.searchIndex = Fuse.createIndex(this.options.keys, [])
      this.fuse = new Fuse([], this.options, this.searchIndex)

    },
    addToIndex(id: string, title: string, url: string, content: string) {
      const doc = {
        id, title, url, content
      }
      this.fuse.add(doc)
      console.log(this.fuse.getIndex().size())
      //this.searchIndex.add(id, content)
    },
    populate (contentPromise: Promise<any[]>) {
      contentPromise
        .then(content => {
          console.log("savedContent", content)
          this.searchIndex = Fuse.createIndex(this.options.keys, content)
          this.fuse = new Fuse(content, this.options, this.searchIndex)
          console.log("index size", this.fuse.getIndex().size())
        })

    }

  }
});
