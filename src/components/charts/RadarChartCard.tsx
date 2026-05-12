import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/locale';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer,
} from 'recharts';
import { AnalysisResult } from '@/types/analysis';

interface RadarChartCardProps {
  dimensions: AnalysisResult['dimensions'];
}

export const RadarChartCard = ({ dimensions }: RadarChartCardProps) => {
  // Normalize values to 0-100 and round. Accept either 0-1 or 0-100 inputs.
  const normalize = (v: number) => {
    if (typeof v !== 'number' || isNaN(v)) return 50;
    const num = v <= 1 ? v * 100 : v;
    return Math.round(Math.max(0, Math.min(100, num)));
  };

  const { t } = useTranslation();

  const data = [
    { subject: t('dim_authority'), value: normalize(dimensions.authority) },
    { subject: t('dim_sentiment'), value: normalize(dimensions.sentiment) },
    { subject: t('dim_accuracy'), value: normalize(dimensions.accuracy) },
    { subject: t('dim_mentions'), value: normalize(dimensions.mentions) },
    { subject: t('dim_recency'), value: normalize(dimensions.recency) },
  ];

  const valuesBySubject: Record<string, number> = data.reduce((acc, d) => {
    acc[d.subject] = d.value;
    return acc;
  }, {} as Record<string, number>);

  const renderTick = (props: any) => {
    const { x, y, payload, cx, cy } = props;
    const label: string = payload?.value;
    const val = valuesBySubject[label];
    // For some labels (Sentiment, Recency) push them slightly outward so they don't overlap the radar fill
    let tx = x;
    let ty = y;
    if ((label === 'Sentiment' || label === 'Recency') && typeof cx === 'number' && typeof cy === 'number') {
      const dx = x - cx;
      const dy = y - cy;
      const factor = 1.12; // push 12% further out
      tx = cx + dx * factor;
      ty = cy + dy * factor;
    }

    // slight extra nudge to the right for Sentiment to avoid overlap
    if (label === 'Sentiment') {
      tx += 10;
    }

    return (
      <text
        x={tx}
        y={ty}
        fill="#E6E6E6"
        fontSize={12}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontWeight: 500 }}
      >
        {label}{val !== undefined ? ` ${Math.round(val)}%` : ''}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-8"
    >
      <h3 className="text-sm font-medium mb-6 text-muted-foreground">{t('aiPerceptionDimensions')}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="hsl(240, 4%, 22%)" />
            <PolarAngleAxis dataKey="subject" tick={renderTick} />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#FFBF00"
              fill="#FFBF00"
              fillOpacity={0.22}
              strokeWidth={3}
              strokeOpacity={1}
              dot={{ r: 3, fill: '#FFBF00' }}
              style={{ filter: 'drop-shadow(0 6px 12px rgba(255,191,0,0.14))' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
