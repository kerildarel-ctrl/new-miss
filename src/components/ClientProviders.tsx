'use client';

import React from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { GoogleTranslator } from '@/components/GoogleTranslator';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <GoogleTranslator />
      {children}
    </LanguageProvider>
  );
}

