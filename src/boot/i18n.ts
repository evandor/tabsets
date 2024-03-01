import {createI18n} from 'vue-i18n'
import messages from '@intlify/unplugin-vue-i18n/messages'

// @ts-ignore
export default ({app}) => {
  const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    // missingWarn: false,
    // fallbackWarn: false,
    allowComposition: true,
    messages
  })
  //console.log("====>", messages)
  app.use(i18n)
}
