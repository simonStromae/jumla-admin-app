'use client';
import { SessionProvider } from 'next-auth/react';
import { LocaleProvider } from '@/src/lib/i18n';
import SessionGuard from '@/src/components/SessionGuard';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <SessionGuard>{children}</SessionGuard>
      </LocaleProvider>
    </SessionProvider>
  );
}
