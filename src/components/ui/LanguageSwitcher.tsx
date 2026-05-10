import React from 'react';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu';
import { Button } from './button';
import { useLocale } from '../../lib/locale';

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLocale();

  const options: Array<{ value: 'en' | 'pl'; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'pl', label: 'Polski' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <Globe className="w-4 h-4" />
          <span className="text-sm">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={6} align="end" className="border-0">
        {options.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setLocale(opt.value)}
            className="flex items-center gap-2"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {locale === opt.value ? <Check className="w-4 h-4" /> : null}
            </span>
            <span className="flex-1">{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
