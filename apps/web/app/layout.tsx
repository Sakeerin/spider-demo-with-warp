/* eslint-disable @next/next/no-page-custom-font */
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'SPIDER',
  description: 'Contractor marketplace',
};

import Header from './components/Header';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        {children}
      </body>
    </html>
  );
}
