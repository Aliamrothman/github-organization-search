/* eslint-disable import/no-named-as-default-member */
import appConfig from 'constants/appConfig'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ru',
    supportedLngs: ['ru'],
    debug: appConfig.api.env === 'development',
    ns: ['common'],
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/github-organization-search/locales/{{lng}}/{{ns}}.json'
    },
    load: 'languageOnly'
  })

export default i18n
