import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/lib/locale';
import { useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { loginUser } from '@/lib/auth';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    const rememberedEmail = localStorage.getItem('rememberEmail') || '';
    if (remembered) {
      setRemember(true);
      setEmail(rememberedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      if (remember) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberEmail');
      }
      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Błąd logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
        <div className="glass-card p-8 mt-12">
          <h2 className="text-2xl font-display mb-4">{t('login')}</h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-1">
              <Label>{t('email')}</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email_placeholder')} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('password')}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              <Label className="!mb-0">{t('remember')}</Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logowanie...' : t('submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;