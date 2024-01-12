import {boot} from 'quasar/wrappers'
import {Logtail} from "@logtail/browser";

const logtail = (process.env.MODE === "bex") ?
  new Logtail("Ht8PY3XGQgqhMyNTcyGyJhXJ") :
  new Logtail("pNfaHtRmWXGd3TFbsCXMHHbB")

export default boot(({}) => {
})

export {
  logtail
}

