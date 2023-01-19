import { boot } from 'quasar/wrappers'
import VueKonva from 'vue-konva'

export default boot(({ app }) => {
  console.log("installing VueKonva")
  app.use(VueKonva)
})
