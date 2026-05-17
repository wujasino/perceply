import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useTranslation } from '@/lib/locale';
import { BrewingProgress } from '@/components/BrewingState';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { RadarChartCard } from '@/components/charts/RadarChartCard';
import { SentimentChart } from '@/components/charts/SentimentChart';
import { SourceDonutChart } from '@/components/charts/SourceDonutChart';
import { SourceTable } from '@/components/SourceTable';
import { useBrewing } from '@/hooks/useBrewing';
import { supabase } from '@/lib/supabase';

// Feature unlock tiers per plan
const PLAN_TIER: Record<string, number> = {
  free: 0,
  solo: 1,       // unlocks Sentiment Trend + Source Breakdown
  growth: 2,     // additionally unlocks Source Table
  enterprise: 2,
};
const tierOf = (plan: string) => PLAN_TIER[plan] ?? 0;

const LockedOverlay = ({ onUpgrade, t }: { onUpgrade: () => void; t: (k: string) => string }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-md rounded-2xl">
    <div className="flex flex-col items-center gap-3 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">{t('upgrade_to_unlock')}</p>
      <button
        onClick={onUpgrade}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {t('upgrade_cta')}
      </button>
    </div>
  </div>
);

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const t = useTranslation().t;
  const analysisId = searchParams.get('id');
  const brandFromUrl = searchParams.get('brand') || 'Tesla';
  const { progress, status, result, startBrewing, reset, loadStoredAnalysis } = useBrewing();
  const displayBrand = result?.brandName || brandFromUrl;
  const [inputValue, setInputValue] = useState(brandFromUrl);
  const [plan, setPlan] = useState<string>('free');
  const planTier = tierOf(plan);
  const canSeeCharts = planTier >= 1;     // Sentiment + Donut
  const canSeeSources = planTier >= 2;    // Source Table

  useEffect(() => {
    const loadPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      if (data?.plan) setPlan(data.plan);
    };
    loadPlan();
  }, []);

  useEffect(() => {
    if (analysisId) {
      loadStoredAnalysis(analysisId);
    } else {
      startBrewing(brandFromUrl);
    }
    return () => reset();
  }, [analysisId, brandFromUrl, reset, startBrewing, loadStoredAnalysis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue?.trim();
    if (!val) return;
    // new search → drop id param and start a fresh brew
    setSearchParams({ brand: val });
    startBrewing(val);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-muted-foreground text-xs mb-2 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> {t('back')}
            </button>
            <h1 className="text-2xl font-display text-foreground">
              {displayBrand} <span className="text-muted-foreground">{t('auditSuffix')}</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-1">
              {status === 'completed' ? `${t('brewed')}${new Date().toLocaleDateString()}` : t('brewingInProgress')}
            </p>
            <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('placeholderExample')}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none py-2 px-3 border border-transparent rounded-md glass-card"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t('brew')}
              </button>
            </form>
          </div>
          {status === 'completed' && (
            <button
              onClick={() => {
                reset();
                setSearchParams({ brand: displayBrand });
                setTimeout(() => startBrewing(displayBrand), 100);
              }}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t('reBrew')}
            </button>
          )}
        </header>

        {/* Brewing State */}
        {status === 'brewing' && (
          <BrewingProgress progress={progress} brandName={displayBrand} />
        )}

        {/* Results */}
        {status === 'completed' && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 lg:col-span-4">
                <TrustScoreGauge score={
                  typeof result.trustScore === 'number' && !isNaN(result.trustScore)
                    ? Math.round(result.trustScore)
                    : Math.round((result.dimensions.authority + result.dimensions.sentiment + result.dimensions.accuracy + result.dimensions.mentions + result.dimensions.recency) / 5)
                } />
              </div>
              <div className="col-span-12 lg:col-span-8">
                <RadarChartCard dimensions={result.dimensions} />
              </div>
              <div className="col-span-12 lg:col-span-7 relative">
                <div className={canSeeCharts ? '' : 'pointer-events-none blur-sm select-none'} aria-hidden={!canSeeCharts}>
                  <SentimentChart data={result.sentimentTrend} />
                </div>
                {!canSeeCharts && <LockedOverlay onUpgrade={() => navigate('/pricing')} t={t} />}
              </div>
              <div className="col-span-12 lg:col-span-5 relative">
                <div className={canSeeCharts ? '' : 'pointer-events-none blur-sm select-none'} aria-hidden={!canSeeCharts}>
                  <SourceDonutChart data={result.sourceBreakdown} />
                </div>
                {!canSeeCharts && <LockedOverlay onUpgrade={() => navigate('/pricing')} t={t} />}
              </div>
              <div className="col-span-12 relative">
                <div className={canSeeSources ? '' : 'pointer-events-none blur-sm select-none'} aria-hidden={!canSeeSources}>
                  <SourceTable sources={result.sources} />
                </div>
                {!canSeeSources && <LockedOverlay onUpgrade={() => navigate('/pricing')} t={t} />}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
