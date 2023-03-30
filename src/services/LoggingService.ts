import {ConsoleHandler, ILogger, Logger, LoggerStore} from "logging-library";
import {LOG_LEVEL_CONSOLE, LOG_LEVEL_PERSITSTENT} from "boot/constants";
import {PersistingHandler} from "src/logging/PersistingHandler"

class LoggingService {

  logger: ILogger  = null as unknown as ILogger

  constructor() {
    console.debug("called new LoggingService")
  }

  async init() {
    console.debug("initializing loggingService")
    this.logger = new Logger()
      .addHandler(new ConsoleHandler(LOG_LEVEL_CONSOLE))
      .addHandler(new PersistingHandler(LOG_LEVEL_PERSITSTENT))
    LoggerStore.add("default2", this.logger)
  }
}
export default new LoggingService();
