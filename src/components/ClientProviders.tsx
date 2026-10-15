'use client';

import React from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { GoogleTranslator } from '@/components/GoogleTranslator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GoogleTranslator />
        {children}
      </LanguageProvider>
    </ErrorBoundary>
  );
}

