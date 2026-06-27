'use client';
import { SessionProvider } from 'next-auth/react';
import { LocaleProvider } from '@/src/lib/i18n';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  );
}
