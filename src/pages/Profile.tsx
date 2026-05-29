import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/locale';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AvatarUpload } from '@/components/charts/AvatarUpload';

interface Analysis {
  id: string;
  trust_score: number;
  brand_name: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  email?: string | null;
  avatar_url?: string | null;
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [subscriptionHistory, setSubscriptionHistory] = useState<Array<{ status: 'active' | 'paused' | 'cancelled'; label: string; timestamp: string }>>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const planLimits: Record<string, number> = {
    free: 10,
    solo: 50,
    growth: 100,
    enterprise: 500,
  };

  const totalAnalysisLimit = user ? planLimits[plan] ?? 10 : 10;
  const analysisProgress = Math.round(Math.min((analyses.length / totalAnalysisLimit) * 100, 100));

  const getInitials = (email?: string | null) => {
    if (!email) return 'BB';
    const local = email.split('@')[0];
    const parts = local.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    return parts.map((part) => part[0].toUpperCase()).slice(0, 2).join('') || 'BB';
  };

  const planStatusNote = user && plan === 'free' && subscriptionStatus === 'active' ? ' (darmowy plan)' : '';

  const handleCookieAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
  };

  useEffect(() => {
    const storedStatus = localStorage.getItem('subscriptionStatus') as 'active' | 'paused' | 'cancelled' | null;
    if (storedStatus) setSubscriptionStatus(storedStatus);

    const storedHistory = localStorage.getItem('subscriptionHistory');
    if (storedHistory) {
      try {
        setSubscriptionHistory(JSON.parse(storedHistory));
      } catch {
        setSubscriptionHistory([]);
      }
    } else {
      const initialRecord = {
        status: 'active' as const,
        label: 'Subskrypcja aktywna od momentu rozpoczęcia',
        timestamp: new Date().toISOString(),
      };
      setSubscriptionHistory([initialRecord]);
      localStorage.setItem('subscriptionHistory', JSON.stringify([initialRecord]));
    }

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
          .select('plan, avatar_url')
          .eq('id', user.id)
          .single();
        if (profileData?.plan) setPlan(profileData.plan);
        if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);

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

  const subscriptionLabels = {
    active: 'Aktywna',
    paused: 'Wstrzymana',
    cancelled: 'Anulowana',
  } as const;

  const subscriptionDotClass = {
    active: 'bg-emerald-400 ring-emerald-400/40',
    paused: 'bg-amber-400 ring-amber-400/40',
    cancelled: 'bg-red-500 ring-red-500/40',
  } as const;

  const recordHistory = (status: 'active' | 'paused' | 'cancelled', label: string) => {
    setSubscriptionHistory((prev) => {
      const next = [{ status, label, timestamp: new Date().toISOString() }, ...prev].slice(0, 10);
      localStorage.setItem('subscriptionHistory', JSON.stringify(next));
      return next;
    });
  };

  const updateSubscriptionStatus = (status: 'active' | 'paused' | 'cancelled') => {
    if (status === subscriptionStatus) return;

    setSubscriptionStatus(status);
    localStorage.setItem('subscriptionStatus', status);

    if (status === 'paused') {
      recordHistory(status, 'Subskrypcja wstrzymana');
      toast('Subskrypcja została wstrzymana.');
      return;
    }

    if (status === 'cancelled') {
      recordHistory(status, 'Subskrypcja anulowana');
      toast('Subskrypcja została anulowana.');
      return;
    }

    recordHistory(status, 'Subskrypcja wznowiona');
    toast('Subskrypcja została wznowiona.');
  };

  const downloadSubscriptionHistory = () => {
    if (subscriptionHistory.length === 0) {
      toast('Brak historii do pobrania.');
      return;
    }

    let content: string;
    let mimeType: string;
    let fileName: string;

    if (exportFormat === 'json') {
      content = JSON.stringify(subscriptionHistory, null, 2);
      mimeType = 'application/json;charset=utf-8;';
      fileName = 'historia-subskrypcji.json';
    } else {
      const headers = ['Data', 'Status', 'Opis'];
      const rows = subscriptionHistory.map((item) => [
        new Date(item.timestamp).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }),
        subscriptionLabels[item.status],
        item.label,
      ]);
      content = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      mimeType = 'text/csv;charset=utf-8;';
      fileName = 'historia-subskrypcji.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast(`Historia subskrypcji została pobrana jako ${exportFormat.toUpperCase()}.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8 font-sans"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground font-sans">Zarządzanie subskrypcją</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {user ? (
                    <AvatarUpload
                      userId={user.id}
                      currentUrl={avatarUrl || undefined}
                      onUpload={(url) => setAvatarUrl(url)}
                    />
                  ) : (
                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
                      <span className="text-lg font-semibold text-primary">{getInitials(user?.email)}</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-sans font-medium text-foreground">{user?.email || 'Ładowanie...'}</h1>
                    <p className="text-sm text-muted-foreground">BitBrew User</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/10 p-4 border border-[hsl(var(--glass-border))]">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {user ? (PLAN_LABELS[plan] ?? 'Free') : `${guestCredits ?? 0} kredytów`}{planStatusNote}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/10 p-4 border border-[hsl(var(--glass-border))]">
                  <p className="text-sm text-muted-foreground">Status subskrypcji</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex h-3 w-3 rounded-full ring-2 ${subscriptionDotClass[subscriptionStatus]} animate-pulse`} />
                    <span className="text-lg font-semibold text-foreground">{subscriptionLabels[subscriptionStatus]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 sm:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <LanguageSwitcher />
                <span className="text-sm text-muted-foreground hidden sm:inline">Zmiana języka</span>
              </div>
              {plan === 'free' && (
                <Button variant="default" onClick={() => navigate('/pricing')}>
                  Ulepsz plan
                </Button>
              )}
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground font-sans">
            Możesz w każdej chwili wstrzymać swoje płatności lub anulować subskrypcję. Po wstrzymaniu kliknij Wznów, by przywrócić aktywny status.
          </p>
          <p className="mt-3 text-sm text-muted-foreground font-sans">
            Niski wynik marki osłabia wiarygodność w social proof — polepsz wynik w dashboardzie, by lepiej wypaść w AI.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/10 p-4 border border-[hsl(var(--glass-border))] text-center">
              <div className="text-2xl font-display text-foreground">{analyses.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('total_brews')}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/10 p-4 border border-[hsl(var(--glass-border))] text-center">
              <div className="text-2xl font-display text-primary">{avgScore || '-'}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('avg_score')}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/10 p-4 border border-[hsl(var(--glass-border))] text-center">
              <div className="text-2xl font-display text-foreground">{user ? (PLAN_LABELS[plan] ?? 'Free') : (guestCredits ?? 0)}</div>
              <div className="text-xs text-muted-foreground mt-1">{user ? t('plan_label') : t('credits_left')}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{analyses.length} / {totalAnalysisLimit} analiz</span>
              <span>{analysisProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950/20">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${analysisProgress}%` }} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {subscriptionStatus === 'active' && (
              <>
                <Button variant="default" onClick={() => updateSubscriptionStatus('paused')}>
                  Wstrzymaj
                </Button>
                <Button variant="outline" onClick={() => updateSubscriptionStatus('cancelled')}>
                  Anuluj
                </Button>
              </>
            )}
            {subscriptionStatus === 'paused' && (
              <>
                <Button variant="default" onClick={() => updateSubscriptionStatus('active')}>
                  Wznów
                </Button>
                <Button variant="outline" onClick={() => updateSubscriptionStatus('cancelled')}>
                  Anuluj
                </Button>
              </>
            )}
            {subscriptionStatus === 'cancelled' && (
              <Button variant="default" onClick={() => updateSubscriptionStatus('active')}>
                Wznów
              </Button>
            )}
          </div>
        </motion.div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-display text-foreground">{t('past_brews')}</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            Zobacz wszystkie
          </Button>
        </div>
        <div className="space-y-3">
          {analyses.length === 0 && (
            <p className="text-muted-foreground text-sm">Brak analiz – wpisz nazwę marki na stronie głównej.</p>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mt-8"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Historia subskrypcji</h3>
                <p className="text-xs text-muted-foreground mt-2 font-sans">Najpierw twoje statystyki, później pełna historia subskrypcji.</p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="export-format" className="text-sm text-muted-foreground">
                  Format eksportu:
                </label>
                <select
                  id="export-format"
                  value={exportFormat}
                  onChange={(event) => setExportFormat(event.target.value as 'csv' | 'json')}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
                <Button variant="secondary" onClick={downloadSubscriptionHistory}>
                  Pobierz historię
                </Button>
              </div>
            </div>

            {subscriptionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak zapisanej historii subskrypcji.</p>
            ) : (
              <div className="space-y-3">
                {subscriptionHistory.map((item) => (
                  <div key={item.timestamp} className="rounded-2xl bg-background/80 p-3 border border-[hsl(var(--glass-border))]">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">{subscriptionLabels[item.status]}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {new Date(item.timestamp).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
