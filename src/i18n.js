import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import id from './locales/id/translation.json'
import en from './locales/en/translation.json'

i18n
  .use(LanguageDetector)   // deteksi bahasa otomatis (localStorage → bahasa browser/HP)
  .use(initReactI18next)
  .init({
    resources    : { id: { translation: id }, en: { translation: en } },
    fallbackLng  : 'id',                       // bahasa tak didukung → fallback Indonesia
    supportedLngs: ['id', 'en'],
    nonExplicitSupportedLngs: true,            // 'en-US'/'en-GB' dianggap 'en'
    interpolation: { escapeValue: false },
    detection: {
      // Urutan deteksi: pilihan tersimpan dulu, baru bahasa browser/HP.
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'lang',              // kompatibel dgn language switcher (key 'lang')
      caches: ['localStorage'],                // simpan pilihan user ke localStorage
    },
  })

export default i18n
