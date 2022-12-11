import { boot } from 'quasar/wrappers'
import VueLogger from 'vuejs3-logger';

export default boot(async ( { app } ) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    isEnabled: true,
    logLevel : isProduction ? 'error' : 'debug',
    stringifyArguments : false,
    showLogLevel : true,
    showMethodName : true,
    separator: '|',
    showConsoleColors: true
  };
  app.use(VueLogger, options);
})

