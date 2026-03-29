import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggle = () => {
    const next = isAr ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="text-muted-foreground hover:text-foreground text-xs gap-1.5">
      <Globe className="w-3.5 h-3.5" />
      {isAr ? 'EN' : 'عربي'}
    </Button>
  );
}
