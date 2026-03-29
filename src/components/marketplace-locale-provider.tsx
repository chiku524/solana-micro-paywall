'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Locale = 'en' | 'es';

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    marketplace: 'Marketplace',
    creator: 'Creator',
    viewCreator: 'View creator profile →',
    purchases: 'purchases',
    purchase: 'purchase',
    preview: 'Preview',
    invalidUrl: 'Invalid content URL',
    notFound: 'Content not found',
    refundTitle: 'Refunds & support',
    relatedTitle: 'You might also like',
    truncatedHint: 'This description is shortened. Unlock the full text after purchase.',
    localeLabel: 'Language',
  },
  es: {
    marketplace: 'Mercado',
    creator: 'Creador',
    viewCreator: 'Ver perfil del creador →',
    purchases: 'compras',
    purchase: 'compra',
    preview: 'Vista previa',
    invalidUrl: 'URL de contenido no válida',
    notFound: 'Contenido no encontrado',
    refundTitle: 'Reembolsos y soporte',
    relatedTitle: 'También te puede gustar',
    truncatedHint: 'Descripción acortada. Desbloquea el texto completo al comprar.',
    localeLabel: 'Idioma',
  },
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const MarketplaceLocaleContext = createContext<Ctx | null>(null);

export function MarketplaceLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = localStorage.getItem('mp_locale') as Locale | null;
    return stored === 'es' ? 'es' : 'en';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem('mp_locale', l);
  }, []);

  const t = useCallback(
    (key: string) => STRINGS[locale][key] ?? STRINGS.en[key] ?? key,
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <MarketplaceLocaleContext.Provider value={value}>{children}</MarketplaceLocaleContext.Provider>
  );
}

export function useMarketplaceLocale(): Ctx {
  const ctx = useContext(MarketplaceLocaleContext);
  if (!ctx) {
    return {
      locale: 'en',
      setLocale: () => {},
      t: (key: string) => STRINGS.en[key] ?? key,
    };
  }
  return ctx;
}
