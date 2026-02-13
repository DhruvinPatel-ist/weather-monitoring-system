"use client";

import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';

export function NextIntlProvider({
  children,
  locale
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    const loadMessages = async () => {
      const messages = (await import(`../../messages/${locale}.json`)).default;
      setMessages(messages);
    };
    
    loadMessages();
  }, [locale]);

  if (!messages) {
    return null; // Or a loading spinner
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}