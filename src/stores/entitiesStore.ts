import {defineStore} from 'pinia';
import _, {forEach} from 'lodash'
import {LocalStorage, uid} from "quasar";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {Tab, UrlExtension} from "src/models/Tab";
import ChromeApi from "src/services/ChromeApi";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useTabGroupsStore} from "src/stores/tabGroupsStore";
import {Group} from "src/models/Group";
import {useSpacesStore} from "src/stores/spacesStore";
import {SpecialTabsetIdent} from "src/domain/tabsets/CreateSpecialTabset";
import {usePermissionsStore} from "src/stores/permissionsStore";
import {FeatureIdent} from "src/models/AppFeature";
import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {Collection} from "src/models/Collection";
import {CollectionInCollections} from "src/models/CollectionInCollections";
import {EntityDefinition} from "src/models/EntityDefinition";


function loadEntityDefinition(name: string, entityDefs: Map<string, EntityDefinition>) {
  fetch('./entityDefinitions/' + name + '.definition.json')
    .then((response) => response.json())
    .then((json) => {
      entityDefs.set(json.type.toString().toUpperCase(), json)
    });
}

export const useEntitiesStore = defineStore('entities', {
  state: () => ({

    /**
     * e.g. "notes" -> "private collection", "public collection"
     */
    collections: new Map<string, Map<string, Collection>>(),

    currentCollection: new Map<string, string>(),

    entityDefinitions: new Map<string, EntityDefinition>(),

    localStorage: undefined as unknown as LocalStorage
  }),

  getters: {

    getCurrentCollection: (state) => {
      return (type: string): Collection | undefined => {
        const currentCollectionId = state.currentCollection.get(type)
        const colls = state.collections.get(type)
        return colls ?
          _.find([...colls.values()], c => c.id === currentCollectionId)
          : undefined
      }
    },
    currentCollectionName(): any {
      return this.getCurrentCollection.name || 'undefined'
    },

  },

  actions: {

    async loadEntityDefinitions() {
      loadEntityDefinition("stocks", this.entityDefinitions)
      loadEntityDefinition("todos", this.entityDefinitions)
      loadEntityDefinition("notes", this.entityDefinitions)
    },

    async createCollection(collectionType: string, collectionName: string): Promise<CollectionInCollections> {
      // console.log("starting with collections", this.collections, collectionType)
      var existingCollectionsForType: Map<string, Collection> | undefined = this.collections.get(collectionType)
      console.log("found existingCollectionType", existingCollectionsForType)
      if (!existingCollectionsForType) {
        existingCollectionsForType = new Map<string, Collection>()
        this.collections.set(collectionType, existingCollectionsForType)
      }
      const foundTS: Collection | undefined = _.find([...existingCollectionsForType.values()], ts => ts.name === collectionName)
      // console.log("found collection", foundTS)
      if (foundTS) {
        return Promise.reject("collection already exists")
      }

      let collection: Collection = null as unknown as Collection
      const useId = uid()
      collection = new Collection(useId, collectionName, [], [], [])
      existingCollectionsForType.set(useId, collection)
      // console.log("returning", existingCollectionType)
      return new CollectionInCollections(collection, existingCollectionsForType)
    },

    addCollection(key: string, coll: any) {
      console.log("adding collection", key, coll)
      // ts.tabs = _.filter(ts.tabs, (t: Tab) => t !== null)
      // this.tabsets.set(ts.id, ts)
      this.collections.set(key, coll)
      // markDuplicates(ts)
    },
  }
});
