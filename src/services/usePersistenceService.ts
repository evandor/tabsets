import IndexedDbPersistenceService from "src/services/IndexedDbPersistenceService";
import PersistenceService from "src/services/PersistenceService";
import {ConsoleHandler, Logger, LoggerStore} from "logging-library";
import {LOG_LEVEL_CONSOLE, LOG_LEVEL_PERSITSTENT} from "boot/constants";
import {TabLogger} from "src/services/useLoggingService";

// export function usePersistenceService() {
//
//   const persistentService: PersistenceService = IndexedDbPersistenceService
//   /**
//    * we use indexedDB here; can be replaced with firebase or something else if needed
//    */
//   return {
//     persistentService
//   }
//
// }

export function usePersistenceService() {

  const persistenceService = IndexedDbPersistenceService

  const logger = new Logger()
    .addHandler(new ConsoleHandler(LOG_LEVEL_CONSOLE))
    //.addHandler(new PersistingHandler(LOG_LEVEL_PERSITSTENT))

  LoggerStore.add("default", logger)

  const getLogs = () => {
    return persistenceService.getLogs()
    //.then((ls: any[]) => logs.value = ls)
  }


  return {
    getLogs, logger, TabLogger, persistenceService
  }

}
