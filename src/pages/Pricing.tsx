import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { pricingTiers } from '@/data/mockData';
import { useTranslation } from '@/lib/locale';

const Pricing = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-display text-foreground mb-3">
            {t('pricing_title')}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {t('pricing_subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card-hover p-7 flex flex-col ${
                tier.highlighted ? 'border-primary/30 ring-1 ring-primary/20' : ''
              }`}
            >
              {tier.highlighted && (
                <span className="text-[10px] text-primary uppercase tracking-widest font-data mb-3">
                  {t('most_popular')}
                </span>
              )}
              <h3 className="text-lg font-medium text-foreground">{tier.name}</h3>
              <div className="mt-3 mb-4">
                <span className="text-4xl font-display text-foreground">{tier.price}</span>
                <span className="text-muted-foreground text-sm">{tier.period}</span>
              </div>
              <p className="text-muted-foreground text-sm mb-6">{tier.description}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 ${
                  tier.highlighted
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {tier.price === 'Custom' ? t('contact_sales') : t('get_started')}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
