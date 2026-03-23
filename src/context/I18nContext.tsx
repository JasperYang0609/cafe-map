import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import i18n, { SUPPORTED_LANGUAGES } from '../lib/i18n';

interface I18nContextType {
  locale: string;
  t: (key: string, options?: Record<string, any>) => string;
  setLocale: (code: string) => void;
  currentLang: { code: string; label: string; flag: string };
}

const I18nContext = createContext<I18nContextType>({
  locale: 'zh-TW',
  t: (key) => key,
  setLocale: () => {},
  currentLang: SUPPORTED_LANGUAGES[0],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(i18n.locale);

  const setLocale = useCallback((code: string) => {
    i18n.locale = code;
    setLocaleState(code);
  }, []);

  const t = useCallback((key: string, options?: Record<string, any>) => {
    return i18n.t(key, options);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentLang = SUPPORTED_LANGUAGES.find(
    (l) => locale.startsWith(l.code) || l.code.startsWith(locale.split('-')[0])
  ) || SUPPORTED_LANGUAGES[0];

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, currentLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { SUPPORTED_LANGUAGES };
