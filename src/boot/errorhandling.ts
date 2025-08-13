import { boot } from 'quasar/wrappers'
import { useErrorHandlingConfig } from 'src/core/config/errorHandlingConfig'

//https://enterprisevue.dev/blog/error-handling-in-vue-3/
export default boot(async ({ app }) => {
  console.log('errorhandling.ts...')
  const { setupErrorHandling } = useErrorHandlingConfig()
  var scope = setupErrorHandling()

  app.config.errorHandler = (err: any, vm, info) => {
    console.log('got error!', typeof err, err)
    scope.captureException(new Error(err.toString() + ': ' + err.stack))

    //console.error("-- Scope:", res);
    console.error('-- Error:', err)
    console.error('-- Vue component:', vm)
    console.error('-- Additional info:', info)
  }
})
