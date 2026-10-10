'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: { pageLanguage: string; autoDisplay?: boolean; includedLanguages?: string },
          containerId: string
        ) => void;
      };
    };
  }
}

export function GoogleTranslator() {
  const { lang } = useLanguage();

  useEffect(() => {
    // Helper to set cookie
    const setGoogTransCookie = (targetLang: string) => {
      const value = targetLang === 'EN' ? '/fr/en' : '/fr/fr';
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      const domain = window.location.hostname;
      
      document.cookie = `googtrans=${value}; path=/; expires=${expires}`;
      document.cookie = `googtrans=${value}; path=/; domain=${domain}; expires=${expires}`;
      document.cookie = `googtrans=${value}; path=/; domain=.${domain}; expires=${expires}`;
    };

    // Load Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'fr',
              includedLanguages: 'fr,en',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    setGoogTransCookie(lang);

    // If Google Translate select box exists on page, trigger language change directly
    const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (selectElem) {
      const targetCode = lang === 'EN' ? 'en' : 'fr';
      if (selectElem.value !== targetCode) {
        selectElem.value = targetCode;
        selectElem.dispatchEvent(new Event('change'));
      }
    }
  }, [lang]);

  return (
    <div id="google_translate_element" style={{ display: 'none', visibility: 'hidden' }} />
  );
}
