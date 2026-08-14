'use client';
import { SessionProvider } from 'next-auth/react';
import { LocaleProvider } from '@/src/lib/i18n';
import { CurrencyProvider } from '@/src/lib/useCurrency';
import SessionGuard from '@/src/components/SessionGuard';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <CurrencyProvider>
          <SessionGuard>{children}</SessionGuard>
        </CurrencyProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
