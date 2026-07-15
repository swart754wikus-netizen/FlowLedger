import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'FlowLedger — Cashflow clarity. VAT confidence. Business control.',
  description: 'The modern finance operating system for small businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased bg-midnight text-t1">
        {children}
        <a
          href="https://gls-technologies.co.za/"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-3 right-3 z-50 rounded-full border border-midnight-border2 bg-midnight-card/90 px-3 py-1.5 text-xs text-t2 backdrop-blur transition-colors hover:text-emerald"
        >
          Powered by GLS Technologies
        </a>
      </body>
    </html>
  );
}
