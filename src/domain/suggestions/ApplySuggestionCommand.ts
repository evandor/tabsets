import Command from "src/domain/Command";
import {ExecutionResult} from "src/domain/ExecutionResult";
import {Suggestion} from "src/models/Suggestion";
import {useBookmarksStore} from "stores/bookmarksStore";
import {useSuggestionsStore} from "stores/suggestionsStore";
import {useUtils} from "src/services/Utils";

const {sendMsg} = useUtils()

export class ApplySuggestionCommand implements Command<any> {

    constructor(public suggestion: Suggestion) {
    }

    async execute(): Promise<ExecutionResult<any>> {
        switch (this.suggestion.type?.toString()) {
            case 'REDIRECT_HAPPENED_FOR_BOOKMARK':
                useBookmarksStore().updateUrl(
                    this.suggestion.data['url' as keyof object],
                    this.suggestion.data['location' as keyof object])
                return useSuggestionsStore().applySuggestion(this.suggestion.id)
                    .then((res: Suggestion) => {
                        sendMsg("reload-suggestions", {})
                        return res
                    })
                    .then((res) => {
                        return Promise.resolve(
                            new ExecutionResult("", "The suggestion has been applied")
                        )
                    })
                    .catch((err) => {
                        return Promise.reject("Problem applying suggestion: " + err)
                    })

            default:
                return Promise.reject("unknown suggestion type: " + this.suggestion.type)
        }
    }


}

ApplySuggestionCommand.prototype.toString = function cmdToString() {
    return `ApplySuggestionCommand: {suggestion=${this.suggestion.toString()}}`;
};
