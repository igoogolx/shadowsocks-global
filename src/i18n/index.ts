import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";

i18n
  .use(initReactI18next)
  .init({
    lng: "en",
    debug: true,
    returnObjects: true,
    resources: {
      en: {
        translation: en,
      },
    },
  })
  .catch((e) => {
    console.log(e);
  });
