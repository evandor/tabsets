import {useLogsStore} from "stores/logsStore";

export default function overrideLog() {

  const o_log = console.log;
  const o_warn = console.warn
  const o_error = console.error

  console.log = (...args) => {
    useLogsStore().appendLog({
      log: args.join(" "),
    })
    o_log("intercepted", ...args);
  };

  console.warn = (...args) => {
    useLogsStore().appendWarning({
      log: args.join(" "),
    })
    o_warn("intercepted", ...args);
  };

  console.error = (...args) => {
    useLogsStore().appendError({
      log: args.join(" "),
    })
    o_error("intercepted", ...args);
  };
}
