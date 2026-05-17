import { motion } from 'framer-motion';
import { Coffee, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/locale';
import { Navbar } from '@/components/layout/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Analysis {
  id: string;
  trust_score: number;
  brand_name: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email?: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  solo: 'Solo Brew',
  growth: 'Growth Roast',
  enterprise: 'Enterprise Roast',
};

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [guestCredits, setGuestCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('free');

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        const key = 'guestCredits';
        let credits = Number(localStorage.getItem(key));
        if (!Number.isFinite(credits) || credits < 0) {
          credits = 3;
          localStorage.setItem(key, String(credits));
        }
        setGuestCredits(credits);
      }

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        if (profileData?.plan) setPlan(profileData.plan);

        const { data } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const seen = new Set<string>();
          const unique = data.filter((a) => {
            const key = a.brand_name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setAnalyses(unique);
          const avg = Math.round(unique.reduce((sum, a) => sum + a.trust_score, 0) / unique.length);
          setAvgScore(avg);
        }
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display text-foreground">{user?.email || 'Ładowanie...'}</h1>
              <p className="text-sm text-muted-foreground">BitBrew User</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[hsl(var(--glass-border))]">
            <div className="text-center">
              <div className="text-2xl font-display text-foreground">{analyses.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('total_brews')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-primary">{avgScore || '—'}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('avg_score')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display text-foreground">
                {user ? (PLAN_LABELS[plan] ?? 'Free') : (guestCredits ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {user ? t('plan_label') : t('credits_left')}
              </div>
            </div>
          </div>
        </motion.div>

        <h2 className="text-lg font-display text-foreground mb-4">{t('past_brews')}</h2>
        <div className="space-y-3">
          {analyses.length === 0 && (
            <p className="text-muted-foreground text-sm">Brak analiz — wpisz nazwę marki na stronie głównej.</p>
          )}
          {analyses.map((brew, i) => (
            <motion.div
              key={brew.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/dashboard?id=${encodeURIComponent(brew.id)}`)}
              className="glass-card-hover p-5 cursor-pointer flex items-center justify-between hover:!border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">{brew.brand_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(brew.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-display text-primary">{brew.trust_score}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
