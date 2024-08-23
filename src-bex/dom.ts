// Hooks added here have a bridge allowing communication between the Web Page and the BEX Content Script.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/dom-hooks
import {bexDom} from 'quasar/wrappers'
import {useUtils} from "src/core/services/Utils";

const {sendMsg} = useUtils()

export default bexDom((bridge) => {

  console.log("=====================")


  //alert("sendingsending")
  // bridge.send('quasar.detect', {})
  //   .then((answer: any) => {
  //     console.log("answer", answer)
  //   })
  //   .catch((error: any) => {
  //     console.log("error", error)
  //   })
})
