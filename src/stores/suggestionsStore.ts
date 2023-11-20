import {defineStore} from 'pinia';
import {computed, ref, unref} from "vue";
import {StaticSuggestionIdent, Suggestion, SuggestionState} from "src/models/Suggestion";
import _ from "lodash";
import PersistenceService from "src/services/PersistenceService";

// seems like it is a good idea to initialize the stores with the db(s) needed
//const {db} = useDB()
let storage: PersistenceService = null as unknown as PersistenceService


export const useSuggestionsStore = defineStore('suggestions', () => {

    const suggestions = ref<Suggestion[]>([])

    function init(providedDb: PersistenceService) {
        console.debug("initializing SuggestionsService")
        storage = providedDb
        loadSuggestionsFromDb()
    }

    function loadSuggestionsFromDb() {
        if (storage) {
            storage.getSuggestions()
                .then((res: Suggestion[]) => {
                    suggestions.value = res
                })
        }
    }

    async function addSuggestion(s: Suggestion | undefined) {
        console.log("about to add suggestion", s)
        if (!s) {
            return Promise.reject("suggestion undefined")
        }
        try {
            await storage.addSuggestion(s)
            console.log("%cpushing", "color:red", s)
            suggestions.value.push(s)
            return Promise.resolve(true)
        } catch (err) {
            console.log("rejected adding due to ", err)
            return Promise.reject(err)
        }
    }

    function inactivateSuggestion(s: Suggestion | undefined) {
        if (s) {
            s.state = SuggestionState.INACTIVE
            console.log("about to inactivate suggestion", s)
            storage.addSuggestion(s)
                .then(() => suggestions.value.push(s))
                .catch((err) => {
                    console.log("rejected adding due to ", err)
                })
        }
    }

    function removeSuggestion(ident: StaticSuggestionIdent) {
        if (storage) {
            storage.removeSuggestion(ident)
                .then(() => suggestions.value = _.filter(suggestions.value, s => s.id !== ident))
        } else {
            console.warn("could not remove suggestions as storage is not defined")
        }
    }

    function cancelSuggestion(id: string): Promise<void> {
        return storage.setSuggestionState(id, SuggestionState.CANCELED)
            .then((res: any) => loadSuggestionsFromDb())
    }

    function ignoreSuggestion(id: string): Promise<void> {
        return storage.setSuggestionState(id, SuggestionState.IGNORED)
            .then((res: any) => loadSuggestionsFromDb())
    }

    function suggestionAsNotification(id: string): Promise<void> {
        return storage.setSuggestionState(id, SuggestionState.NOTIFICATION)
            .then((res: any) => loadSuggestionsFromDb())
    }

    function applySuggestion(id: string): Promise<Suggestion> {
        console.log("$applied suggestion", "background-color:grey", id)
        return storage.setSuggestionState(id, SuggestionState.APPLIED)
            .then((res: any) => {
                loadSuggestionsFromDb();
                return res
            })

    }

    const getSuggestions = computed(() => {
        return () => {
            const sugs: Suggestion[] = suggestions.value
            const r = _.groupBy(sugs, s => (s: Suggestion) => {
                return s.type + "|" + s.url
            })
            const result: Suggestion[] = []
            for (const v of Object.values(r)) {
                for (let i = v.length; i >= 0; i--) {
                    if (i == 0) {
                        result.push(v[0])
                    } else {
                        // remove duplicates
                        //removeSuggestionById(v[i].id)
                    }
                }
            }
            return result
        }
    })

    const getSuggestion = computed(() => {
        return (suggestionId: string) => _.find(suggestions.value, s => s.id === suggestionId)
    })


    return {
        init,
        loadSuggestionsFromDb,
        addSuggestion,
        getSuggestions,
        getSuggestion,
        ignoreSuggestion,
        cancelSuggestion,
        removeSuggestion,
        suggestionAsNotification,
        applySuggestion,
        inactivateSuggestion
    }

})
