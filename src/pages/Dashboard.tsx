import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useTranslation } from '@/lib/locale';
import { BrewingProgress } from '@/components/BrewingState';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { RadarChartCard } from '@/components/charts/RadarChartCard';
import { SentimentChart } from '@/components/charts/SentimentChart';
import { SourceDonutChart } from '@/components/charts/SourceDonutChart';
import { SourceTable } from '@/components/SourceTable';
import { useBrewing } from '@/hooks/useBrewing';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const t = useTranslation().t;
  const brandName = searchParams.get('brand') || 'Tesla';
  const [inputValue, setInputValue] = useState(brandName);
  const { progress, status, result, startBrewing, reset } = useBrewing();

  useEffect(() => {
    startBrewing(brandName);
    return () => reset();
  }, [brandName, reset, startBrewing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue?.trim();
    if (!val) return;
    // update URL and start brewing immediately
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
              {brandName} <span className="text-muted-foreground">{t('auditSuffix')}</span>
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
              onClick={() => { reset(); setTimeout(() => startBrewing(brandName), 100); }}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t('reBrew')}
            </button>
          )}
        </header>

        {/* Brewing State */}
        {status === 'brewing' && (
          <BrewingProgress progress={progress} brandName={brandName} />
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
                  // if API didn't provide trustScore, derive from average of dimensions
                  typeof result.trustScore === 'number' && !isNaN(result.trustScore)
                    ? Math.round(result.trustScore)
                    : Math.round((result.dimensions.authority + result.dimensions.sentiment + result.dimensions.accuracy + result.dimensions.mentions + result.dimensions.recency) / 5)
                } />
              </div>
              <div className="col-span-12 lg:col-span-8">
                <RadarChartCard dimensions={result.dimensions} />
              </div>
              <div className="col-span-12 lg:col-span-7">
                <SentimentChart data={result.sentimentTrend} />
              </div>
              <div className="col-span-12 lg:col-span-5">
                <SourceDonutChart data={result.sourceBreakdown} />
              </div>
              <div className="col-span-12">
                <SourceTable sources={result.sources} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
