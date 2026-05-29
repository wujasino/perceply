import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/locale';

interface TrustScoreGaugeProps {
  score: number;
  trend?: { date: string; score: number }[];
}

export const TrustScoreGauge = ({ score, trend }: TrustScoreGaugeProps) => {
  const { t } = useTranslation();

  const getScoreKey = (s: number) => {
    if (s >= 85) return 'score_excellent';
    if (s >= 70) return 'score_high';
    if (s >= 50) return 'score_moderate';
    return 'score_low';
  };

  const benchmark = Math.min(85, Math.max(55, 40 + Math.round(score * 0.4)));
  const delta = trend && trend.length >= 2 ? trend[trend.length - 1].score - trend[trend.length - 2].score : null;
  const deltaLabel = delta !== null ? `${delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} ${Math.abs(delta)} pkt` : null;

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
      <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
        <p>{`Lepiej niż ${benchmark}% marek w Twojej branży.`}</p>
        {deltaLabel && (
          <p className="text-xs text-foreground/80">{`Trend: ${deltaLabel} od poprzedniej analizy`}</p>
        )}
      </div>
    </div>
  );
};
