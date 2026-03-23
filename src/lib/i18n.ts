import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import zhTW from '../locales/zh-TW.json';
import en from '../locales/en.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import zhCN from '../locales/zh-CN.json';
import th from '../locales/th.json';

const i18n = new I18n({
  'zh-TW': zhTW,
  'zh-Hant': zhTW,
  en,
  ja,
  ko,
  'zh-CN': zhCN,
  'zh-Hans': zhCN,
  th,
});

// Set default locale from device
const deviceLocale = Localization.getLocales()[0]?.languageTag || 'zh-TW';
i18n.locale = deviceLocale;
i18n.enableFallback = true;
i18n.defaultLocale = 'zh-TW';

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
];

export default i18n;
