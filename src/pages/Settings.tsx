import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, User, Bell, Shield, Trash2, Moon, Globe, ChevronRight, Save,
  Upload, Camera, Loader2, KeyRound, Copy, Check, Mail, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/lib/locale';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Tab = 'account' | 'appearance' | 'notifications' | 'security' | 'privacy' | 'danger';

const tabs: { id: Tab; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'account',       labelKey: 'settings_tab_account',       icon: User },
  { id: 'appearance',    labelKey: 'settings_tab_appearance',    icon: Moon },
  { id: 'notifications', labelKey: 'settings_tab_notifications', icon: Bell },
  { id: 'security',      labelKey: 'settings_tab_security',      icon: KeyRound },
  { id: 'privacy',       labelKey: 'settings_tab_privacy',       icon: Shield },
  { id: 'danger',        labelKey: 'settings_tab_danger',        icon: Trash2 },
];

export default function Settings() {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifBrewComplete, setNotifBrewComplete] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security tab
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);
      setEmail(user.email ?? '');
      setDisplayName(user.user_metadata?.full_name ?? '');
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
    });
  }, [navigate]);

  const initials = email ? email[0].toUpperCase() : '?';

  const handleAvatarFile = async (file: File) => {
    if (!userId) return;
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError(t('settings_avatar_invalid_type'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(t('settings_avatar_too_large'));
      return;
    }

    setUploading(true);

    // Show instant local preview while uploading
    const blobUrl = URL.createObjectURL(file);
    setAvatarUrl(blobUrl);

    try {
      const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_EXTS.includes(ext)) {
        throw new Error(t('settings_avatar_invalid_type'));
      }
      // Always overwrite the same path — avoids orphaned files in storage
      const storagePath = `${userId}/avatar.${ext}`;

      const { error: storageError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, file, { upsert: true, contentType: file.type });
      if (storageError) throw storageError;

      // Add cache-busting so the browser doesn't show stale image
      const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Update auth user_metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (authError) throw authError;

      // Refresh session so the updated JWT / metadata is returned by getUser()
      await supabase.auth.refreshSession();

      // Mirror to profiles table (best-effort)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);

      URL.revokeObjectURL(blobUrl);
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      URL.revokeObjectURL(blobUrl);
      setAvatarUrl(null);
      setUploadError(
        err?.message?.includes('Bucket not found')
          ? 'Bucket "avatars" nie istnieje w Supabase Storage. Uruchom migrację SQL.'
          : err?.message?.includes('row-level security')
          ? 'Brak uprawnień do zapisu. Sprawdź polityki RLS bucketa "avatars".'
          : t('settings_avatar_upload_error')
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!userId) return;
    setUploading(true);
    try {
      await supabase.auth.updateUser({ data: { avatar_url: null } });
      await supabase.auth.refreshSession();
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
      setAvatarUrl(null);
    } catch (err) {
      console.error('Avatar remove error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
      if (error) throw error;
      await supabase.auth.refreshSession();
      await supabase.from('profiles').update({ full_name: displayName }).eq('id', userId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendReset = async () => {
    if (!email) return;
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    setResetSent(true);
  };

  const handleViewRecoveryCode = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('recovery_codes')
      .select('code_hash, created_at')
      .eq('user_id', userId)
      .single();
    if (data) {
      // We only show that a code exists + when it was generated (not the plain code — it's hashed)
      setRecoveryCode(data.created_at);
    } else {
      setRecoveryCode('none');
    }
  };

  const copyResetLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/reset-password`);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('settings_delete_confirm'))) return;
    await supabase.auth.signOut();
    navigate('/');
  };

  const close = () => navigate(-1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel — static after mount, no re-animation on tab change */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex overflow-hidden rounded-2xl border border-[hsl(var(--glass-border))] bg-background/95 shadow-2xl">

          {/* Sidebar */}
          <aside className="w-52 shrink-0 border-r border-[hsl(var(--glass-border))] bg-muted/30 flex flex-col p-3 gap-0.5">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {t('settings')}
            </p>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {t(tab.labelKey)}
                {activeTab === tab.id && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--glass-border))]">
              <h2 className="text-base font-semibold text-foreground">
                {t(tabs.find(t => t.id === activeTab)?.labelKey ?? 'settings')}
              </h2>
              <button
                onClick={close}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── ACCOUNT ── */}
              {activeTab === 'account' && (
                <>
                  {/* Avatar uploader */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleAvatarFile(file);
                    }}
                    className={cn(
                      'flex items-center gap-5 p-4 rounded-xl border border-dashed transition-colors',
                      dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-[hsl(var(--glass-border))] bg-muted/20'
                    )}
                  >
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="relative block"
                        aria-label={t('settings_avatar_change')}
                      >
                        <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                          <AvatarImage src={avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {uploading
                            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                            : <Camera className="w-5 h-5 text-white" />}
                        </div>
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dragOver ? t('settings_avatar_drop') : t('settings_avatar_hint')}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          {avatarUrl ? t('settings_avatar_change') : t('settings_avatar_upload')}
                        </Button>
                        {avatarUrl && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={uploading}
                            onClick={handleAvatarRemove}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                            {t('settings_avatar_remove')}
                          </Button>
                        )}
                      </div>
                      {uploadError && (
                        <p className="text-xs text-destructive mt-2">{uploadError}</p>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarFile(file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  <div className="h-px bg-border" />

                  {/* Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        {t('settings_display_name')}
                      </label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t('settings_display_name_placeholder')}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        {t('email')}
                      </label>
                      <Input value={email} disabled className="opacity-60" />
                      <p className="text-xs text-muted-foreground mt-1">{t('settings_email_hint')}</p>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} size="sm">
                    {saved ? '✓ Zapisano' : saving ? t('settings_saving') : (
                      <><Save className="w-3.5 h-3.5 mr-1.5" />{t('settings_save')}</>
                    )}
                  </Button>
                </>
              )}

              {/* ── APPEARANCE ── */}
              {activeTab === 'appearance' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-3">
                      <Globe className="inline w-4 h-4 mr-1.5 text-primary" />
                      {t('settings_language')}
                    </label>
                    <div className="flex gap-2">
                      {(['pl', 'en'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setLocale(lang)}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm border transition-colors',
                            locale === lang
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-input text-muted-foreground hover:text-foreground hover:bg-accent'
                          )}
                        >
                          {lang === 'pl' ? '🇵🇱 Polski' : '🇬🇧 English'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      <Moon className="inline w-4 h-4 mr-1.5 text-primary" />
                      {t('settings_theme')}
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">{t('settings_theme_hint')}</p>
                    <div className="flex gap-2">
                      {['dark', 'light', 'system'].map((theme) => (
                        <button
                          key={theme}
                          className="px-4 py-2 rounded-lg text-sm border border-input text-muted-foreground hover:text-foreground hover:bg-accent transition-colors capitalize"
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  {[
                    { label: t('settings_notif_brew'), desc: t('settings_notif_brew_desc'), value: notifBrewComplete, set: setNotifBrewComplete },
                    { label: t('settings_notif_newsletter'), desc: t('settings_notif_newsletter_desc'), value: notifNewsletter, set: setNotifNewsletter },
                    { label: t('settings_notif_marketing'), desc: t('settings_notif_marketing_desc'), value: notifMarketing, set: setNotifMarketing },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[hsl(var(--glass-border))] bg-muted/20">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => item.set(!item.value)}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                          item.value ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform',
                            item.value ? 'translate-x-4' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeTab === 'security' && (
                <div className="space-y-5">

                  {/* Reset password */}
                  <div className="p-4 rounded-xl border border-[hsl(var(--glass-border))] bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Resetuj hasło</p>
                        <p className="text-xs text-muted-foreground">
                          Wyślemy link resetujący na adres <strong>{email}</strong>
                        </p>
                      </div>
                    </div>

                    {resetSent ? (
                      <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 rounded-lg px-3 py-2">
                        <Check className="w-4 h-4 shrink-0" />
                        Email wysłany! Sprawdź swoją skrzynkę i kliknij link.
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resetLoading}
                        onClick={handleSendReset}
                        className="w-full"
                      >
                        {resetLoading ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Wyślij link resetujący
                      </Button>
                    )}
                  </div>

                  {/* Recovery code info */}
                  <div className="p-4 rounded-xl border border-[hsl(var(--glass-border))] bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Kod zapasowy</p>
                        <p className="text-xs text-muted-foreground">
                          Generowany po każdym resecie hasła. Pozwala odzyskać dostęp do konta.
                        </p>
                      </div>
                    </div>

                    {recoveryCode === null && (
                      <Button size="sm" variant="outline" className="w-full" onClick={handleViewRecoveryCode}>
                        <Shield className="w-3.5 h-3.5 mr-1.5" />
                        Sprawdź status kodu
                      </Button>
                    )}
                    {recoveryCode === 'none' && (
                      <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                        Brak kodu zapasowego. Zresetuj hasło — po resecie otrzymasz nowy kod.
                      </p>
                    )}
                    {recoveryCode && recoveryCode !== 'none' && (
                      <div className="text-xs text-muted-foreground bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 space-y-1">
                        <p className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                          <Check className="w-3.5 h-3.5" /> Kod zapasowy aktywny
                        </p>
                        <p>Wygenerowany: {new Date(recoveryCode).toLocaleDateString('pl-PL', { dateStyle: 'medium' })}</p>
                        <p>Kod jest zaszyfrowany — jego treść widzisz tylko bezpośrednio po resecie hasła.</p>
                      </div>
                    )}
                  </div>

                  {/* Reset link shortcut */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => window.open(`${window.location.origin}/reset-password`, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Przejdź do strony resetu hasła
                  </Button>

                </div>
              )}

              {/* ── PRIVACY ── */}
              {activeTab === 'privacy' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('settings_privacy_desc')}</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="/polityka-prywatnosci"
                      target="_blank"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Shield className="w-4 h-4" /> {t('privacy')}
                    </a>
                    <a
                      href="/regulamin"
                      target="_blank"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Shield className="w-4 h-4" /> {t('terms')}
                    </a>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="p-4 rounded-xl border border-[hsl(var(--glass-border))] bg-muted/20">
                    <p className="text-sm font-medium text-foreground mb-1">{t('settings_data_export')}</p>
                    <p className="text-xs text-muted-foreground mb-3">{t('settings_data_export_desc')}</p>
                    <Button variant="outline" size="sm">
                      {t('settings_data_export_btn')}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── DANGER ── */}
              {activeTab === 'danger' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                    <p className="text-sm font-semibold text-foreground mb-1">{t('settings_delete_account')}</p>
                    <p className="text-xs text-muted-foreground mb-4">{t('settings_delete_desc')}</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      {t('settings_delete_account')}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
      </div>
    </div>
  );
}
