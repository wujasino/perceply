import { useEffect } from 'react';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brandName = searchParams.get('brand') || 'Tesla';
  const { progress, status, result, startBrewing, reset } = useBrewing();

  useEffect(() => {
    startBrewing(brandName);
    return () => reset();
  }, [brandName]);

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
              <ArrowLeft className="w-3 h-3" /> {useTranslation().t('back')}
            </button>
            <h1 className="text-2xl font-display text-foreground">
              {brandName} <span className="text-muted-foreground">{useTranslation().t('auditSuffix')}</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-1">
              {status === 'completed' ? `${useTranslation().t('brewed')}${new Date().toLocaleDateString()}` : useTranslation().t('brewingInProgress')}
            </p>
          </div>
          {status === 'completed' && (
            <button
              onClick={() => { reset(); setTimeout(() => startBrewing(brandName), 100); }}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {useTranslation().t('reBrew')}
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
                <TrustScoreGauge score={result.trustScore} />
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
