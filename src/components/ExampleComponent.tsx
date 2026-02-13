"use client";

import { useTranslations } from '@/hooks/useTranslations';

export function ExampleComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('Login Now')}</h1>
      <p>{t('Welcome back! Please enter your details')}</p>
      {/* Other translated content */}
    </div>
  );
}