import {createI18n} from 'vue-i18n'
import messages from '@intlify/unplugin-vue-i18n/messages'

// @ts-ignore
export default ({app}) => {
  // console.log("====>", navigator.language)
  const i18n = createI18n({
    locale: navigator.language.split('-')[0],
    fallbackLocale: 'en',
    // missingWarn: false,
    // fallbackWarn: false,
    allowComposition: true,
    messages
  })
  app.use(i18n)
}
