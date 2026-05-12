import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/locale';

interface TrustScoreGaugeProps {
  score: number;
}

export const TrustScoreGauge = ({ score }: TrustScoreGaugeProps) => {
  const { t } = useTranslation();

  const getScoreKey = (s: number) => {
    if (s >= 85) return 'score_excellent';
    if (s >= 70) return 'score_high';
    if (s >= 50) return 'score_moderate';
    return 'score_low';
  };

  return (
    <div className="glass-card p-8 flex flex-col items-center justify-center">
      <span className="text-muted-foreground uppercase tracking-[0.2em] text-[10px] mb-6">
        {t('overallVisibility')}
      </span>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        className="text-8xl font-light text-primary font-display"
      >
        {typeof score === 'number' && !isNaN(score) ? `${Math.round(score)}%` : '—'}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs border border-primary/20"
      >
        {t(getScoreKey(score))}
      </motion.div>
    </div>
  );
};
