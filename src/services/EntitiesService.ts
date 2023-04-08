import {STRIP_CHARS_IN_USER_INPUT} from "boot/constants";
import {useTabsStore} from "src/stores/tabsStore";
import {Tab} from "src/models/Tab";
import _ from "lodash";
import {uid} from "quasar";
import {NewOrReplacedTabset} from "src/models/NewOrReplacedTabset";
import {useSearchStore} from "src/stores/searchStore";
import ChromeApi from "src/services/ChromeApi";
import {TabPredicate} from "src/domain/Types";
import {Tabset, TabsetStatus, TabsetType} from "src/models/Tabset";
import {useNotificationsStore} from "src/stores/notificationsStore";
import {MetaLink} from "src/models/MetaLink";
import {RequestInfo} from "src/models/RequestInfo";

import {useDB} from "src/services/usePersistenceService";
import {SpecialTabsetIdent} from "src/domain/tabsets/CreateSpecialTabset";
// @ts-ignore
import {v5 as uuidv5} from 'uuid';
import {useSuggestionsStore} from "stores/suggestionsStore";
import {Suggestion, SuggestionType} from "src/models/Suggestion";
import {useSettingsStore} from "src/stores/settingsStore"
import {useEntitiesStore} from "stores/entitiesStore";
import {Collection} from "src/models/Collection";
import {CollectionInCollections} from "src/models/CollectionInCollections";
import {Entity} from "src/models/Entity";

const {db} = useDB()

export function useEntitiesService() {

  const init = async (doNotInitSearchIndex: boolean = false) => {
    console.debug("initializing entities Service")
    await db.loadCollections()
    await useEntitiesStore().loadEntityDefinitions()
    if (!doNotInitSearchIndex) {
      // useSearchStore().populateFromContent(db.getContents())
      // useSearchStore().populateFromTabsets()
    }
  }

  const createCollection = async (type: string, name: string): Promise<Map<string, Collection>> => {
    const trustedType = type.replace(STRIP_CHARS_IN_USER_INPUT, '')
    const trustedName = name.replace(STRIP_CHARS_IN_USER_INPUT, '')
    try {
      const result: CollectionInCollections = await useEntitiesStore().createCollection(trustedType, trustedName)
      if (result) {
        await saveCollection(type, result.collections)
        selectCollection(type, result.collection.id)
        // useSearchStore().indexTabs(result.tabset.id, tabs)
        return result.collections
      }
      return Promise.reject("could not update or create collection")
    } catch (err) {
      return Promise.reject("problem updating or creating collection: " + err)
    }
  }

  const saveCollection = async (type: string, collections: Map<string, Collection>): Promise<any> => {
    //collections.updated = new Date().getTime()
    console.log("saving", type, collections)
    return db.saveCollection(type, collections)
  }

  const selectCollection = (type: string, collectionId: string): void => {
    console.debug("selecting collection", type, collectionId)
    const entitiesStore = useEntitiesStore()
    //resetSelectedTabs()
    entitiesStore.currentCollection.set(type.toUpperCase(), collectionId)
    // localStorage.setItem("selectedCollections", tabsetId)
  }

  const addToCollection = (collectionType: string, collectionId: string, entity: object): Promise< Map<string, Collection>> => {
    //const c = _.find([...useEntitiesStore().collections.keys()], key => key === collectionType)
    const collections: Map<string, Collection> = useEntitiesStore().collections.get(collectionType) || new Map()
    //console.log("hier", c)
    console.log("hier", collections, collectionId)
    const collection = _.find([...collections.values()], v => v.id === collectionId)
    console.log("hie2r", collection)
    if (collection) {
      collection.entities.push(new Entity(uid(), entity))
      return Promise.resolve(collections)
    }
    return Promise.reject("could not add to collection")
  }

  const deleteEntity = (collectionType: string, collectionId: string, entityId: string): Promise<Collection> => {
    console.log("deleting", collectionType, entityId)
    const collections: Map<string, Collection> = useEntitiesStore().collections.get(collectionType) || new Map()
    if (collections) {
      const found = _.find([...collections.values()], c => c.id === collectionId)
      console.log("found", found)
      if (found) {
        found.entities = _.filter(found.entities, e => e.id !== entityId)
        return Promise.resolve(found)
      }
      return Promise.reject("could not find collection id" +  collectionId)
    }
    return Promise.reject("could not find collection type " + collectionType)
  }

  return {
    init,
    createCollection,
    selectCollection,
    saveCollection,
    addToCollection,
    deleteEntity
  }

}
