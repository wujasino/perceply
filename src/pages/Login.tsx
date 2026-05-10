import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/lib/locale';
import { useEffect } from 'react';
import { signInWithGoogle } from '@/lib/googleAuth';
import { LogIn } from 'lucide-react';
import { setAuthUser } from '@/lib/auth';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    const rememberedEmail = localStorage.getItem('rememberEmail') || '';
    if (remembered) {
      setRemember(true);
      setEmail(rememberedEmail);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // placeholder: implement auth
    console.log('login', { email, password, remember });
    if (remember) {
      // store email only (do NOT store password in localStorage)
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberEmail', email);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberEmail');
    }
    navigate('/dashboard');
  };

  const handleGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      console.log('google user', user);
      // create local demo account and navigate
      setAuthUser({ email: user.email || '', name: user.name, provider: 'google' });
      // store last google user for prefill on register
      sessionStorage.setItem('lastGoogleUser', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Google sign-in failed. Set VITE_GOOGLE_CLIENT_ID.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
        <div className="glass-card p-8 mt-12">
          <h2 className="text-2xl font-display mb-4">{t('login')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-1">
              <Label>{t('email')}</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('password')}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              <Label className="!mb-0">{t('remember')}</Label>
            </div>
            <Button type="submit" className="w-full">{t('submit')}</Button>
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" className="w-full flex items-center justify-center gap-2" onClick={handleGoogle}>
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
