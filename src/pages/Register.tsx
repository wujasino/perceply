import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/locale';
import { registerUser } from '@/lib/auth';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('passwords_no_match'));
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Błąd rejestracji');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
          <div className="glass-card p-8 mt-12 text-center">
            <h2 className="text-2xl font-display mb-4">Sprawdź email</h2>
            <p className="text-muted-foreground">Wysłaliśmy link potwierdzający na <strong>{email}</strong>. Kliknij w link żeby aktywować konto.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
        <div className="glass-card p-8 mt-12">
          <h2 className="text-2xl font-display mb-4">{t('register')}</h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-1">
              <Label>{t('email')}</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('password')}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('confirmPassword')}</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Rejestracja...' : t('submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;