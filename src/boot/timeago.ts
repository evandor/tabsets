import { boot } from 'quasar/wrappers'
import timeago from 'vue-timeago3'

export default boot(({ app }) => {
  app.use(timeago)
})
