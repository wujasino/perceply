import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/locale';

interface BrewingProgressProps {
  progress: number;
  brandName: string;
}

export const BrewingProgress = ({ progress, brandName }: BrewingProgressProps) => {
  const { t } = useTranslation();

  const stages = [
    { threshold: 0, label: t('stage_0') },
    { threshold: 20, label: t('stage_1') },
    { threshold: 45, label: t('stage_2') },
    { threshold: 70, label: t('stage_3') },
    { threshold: 90, label: t('stage_4') },
  ];

  const currentStage = [...stages].reverse().find(s => progress >= s.threshold);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-48 h-48"
      >
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96" cy="96" r="88"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-muted"
          />
          <motion.circle
            cx="96" cy="96" r="88"
            stroke="hsl(45, 100%, 50%)"
            strokeWidth="2.5"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray="553"
            initial={{ strokeDashoffset: 553 }}
            animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-primary font-data text-xs uppercase tracking-[0.2em] mb-1"
          >
            {t('brewing_label')}
          </motion.span>
          <span className="text-5xl font-light text-foreground font-data">{progress}%</span>
        </div>
      </motion.div>

      <div className="text-center space-y-2">
        <p className="text-muted-foreground text-sm">{currentStage?.label}</p>
        <p className="text-muted-foreground/50 text-xs">
          {(() => {
            const parts = t('analyzing_across').split('{brand}');
            return (
              <>
                {parts[0]} <span className="text-primary">{brandName}</span> {parts[1]}
              </>
            );
          })()}
        </p>
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: progress > i * 20 ? 'hsl(45, 100%, 50%)' : 'hsl(240, 4%, 18%)' }}
            animate={progress > i * 20 ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
};
