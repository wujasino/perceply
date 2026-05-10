import React, { createContext, useContext, useState, ReactNode } from 'react';

type Locale = 'en' | 'pl';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    home: 'Home',
    dashboard: 'Dashboard',
    pricing: 'Pricing',
    profile: 'Profile',
    bitbrew: 'BitBrew',
    back: 'Back',
    auditSuffix: '/ AI Audit',
    brewed: 'Brewed: ',
    brewingInProgress: 'Brewing in progress...',
    reBrew: 'Re-Brew',
    brew: 'Brew',
    placeholderExample: 'Enter a brand name (e.g. Tesla, Apple)...',
    tryDemo: 'Try "Tesla" or "Apple" for a demo analysis',
    startFirstBrew: 'Start your first brew',
    noCard: 'No credit card required. Get your first 3 brand analyses free.',
    viewPricing: 'View Pricing',
    copyright: '© 2024 BitBrew. All rights reserved.',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    submit: 'Submit',
    haveAccount: 'Already have an account? Login',
    noAccount: "Don't have an account? Register",
    remember: 'Remember me',
  },
  pl: {
    home: 'Strona',
    dashboard: 'Panel',
    pricing: 'Cennik',
    profile: 'Profil',
    bitbrew: 'BitBrew',
    back: 'Wróć',
    auditSuffix: '/ Audyt AI',
    brewed: 'Sparzono: ',
    brewingInProgress: 'Trwa parzenie...',
    reBrew: 'Ponowne parzenie',
    brew: 'Parz',
    placeholderExample: 'Wpisz nazwę marki (np. Tesla, Apple)...',
    tryDemo: 'Wypróbuj "Tesla" lub "Apple" jako demo analizy',
    startFirstBrew: 'Rozpocznij pierwsze parzenie',
    noCard: 'Bez karty. Pierwsze 3 analizy marek gratis.',
    viewPricing: 'Zobacz cennik',
    copyright: '© 2024 BitBrew. Wszelkie prawa zastrzeżone.',
    login: 'Zaloguj',
    register: 'Zarejestruj',
    email: 'Email',
    password: 'Hasło',
    confirmPassword: 'Powtórz hasło',
    submit: 'Wyślij',
    haveAccount: 'Masz konto? Zaloguj się',
    noAccount: 'Nie masz konta? Zarejestruj się',
    remember: 'Zapamiętaj mnie',
  },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>((navigator.language || 'en').startsWith('pl') ? 'pl' : 'en');

  const t = (key: string) => {
    return translations[locale][key] ?? key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return { locale: ctx.locale, setLocale: ctx.setLocale };
};

export const useTranslation = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useTranslation must be used within LocaleProvider');
  return { t: ctx.t, locale: ctx.locale, setLocale: ctx.setLocale };
};

export default LocaleContext;
