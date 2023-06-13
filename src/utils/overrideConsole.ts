import {useLogsStore} from "stores/logsStore";

export default function overrideLog() {

  const o_log = console.log;
  const o_error = console.error

  console.log = (...args) => {

    useLogsStore().appendLog({
      log: args.join(" "),
    })

    // dispatch("appendLog", {
    //   log: args.join(" "),
    // });
    //o_log(...args);
  };

  console.error = (...args) => {

    useLogsStore().appendError({
      log: args.join(" "),
    })

    // dispatch("appendLog", {
    //   log: args.join(" "),
    // });
    o_error(...args);
  };
}
