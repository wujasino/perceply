import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISSED_KEY = 'bitbrew_trial_banner_dismissed';

export const TrialBanner = () => {
  const [visible, setVisible] = useState(false);
  const [plan, setPlan] = useState<'free' | 'paid' | 'loading'>('loading');

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setPlan('free');
        setVisible(true);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      const userPlan = data?.plan ?? 'free';
      if (userPlan === 'free') {
        setPlan('free');
        setVisible(true);
      } else {
        setPlan('paid');
      }
    });
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  const isGuest = plan === 'free';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-primary/90 via-primary to-violet-600 text-primary-foreground text-sm">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-center">
              <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span className="leading-snug">
                {plan === 'free' ? (
                  <>
                    Jesteś na planie <strong>Free</strong> — masz dostęp do 3 analiz miesięcznie.{' '}
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      Sprawdź plany <ArrowRight className="w-3 h-3" />
                    </Link>
                  </>
                ) : (
                  <>
                    Witaj w BitBrew! Zaloguj się lub załóż konto, żeby zobaczyć platformę w akcji.{' '}
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                    >
                      Zacznij za darmo <ArrowRight className="w-3 h-3" />
                    </Link>
                  </>
                )}
              </span>
              <button
                onClick={dismiss}
                aria-label="Zamknij"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
