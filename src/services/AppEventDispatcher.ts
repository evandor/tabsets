import {useSearchStore} from "src/search/stores/searchStore";

/**
 * meant for inter-submodule communication.
 *
 * We cannot use runtime messages for this, neither bex events. Submodule A can create an Event and let
 * this class dispatch it. Depending on the event name, different functions of other submodules can be
 * called.
 *
 * This class has to be implemented once-per-application if this kind of dispatch is needed.
 */
class AppEventDispatcher {

  dispatchEvent(name: string, params:object) {
    console.log("===> event added", name, params)
    switch (name) {
      case 'add-to-search':
        // useSearchStore().addToIndex(uid(),
        //   params['name' as keyof object],
        //   params['title' as keyof object],
        //   params['url' as keyof object],
        //   params['description' as keyof object],
        //   params['content' as keyof object],
        //   params['tabsets' as keyof object],
        //   params['favIconUrl' as keyof object])
        useSearchStore().addObjectToIndex(params)
        break
      default:
        console.log("unknown event")
    }
  }
}

export default new AppEventDispatcher();
