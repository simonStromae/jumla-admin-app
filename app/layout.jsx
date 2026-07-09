import '@/src/styles/tokens.css';
import Providers from './providers';

export const metadata = {
  title: 'Jumla Shipping',
  description: 'Fret international · Douala ↔ Montréal',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1B4FD8" />
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Jumla" />
        <link rel="apple-touch-icon" href="/jumla-icon.png" />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
