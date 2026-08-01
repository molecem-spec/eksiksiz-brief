import { requireAgency } from '@/lib/auth';
import { loadSettings, publicAssetUrl } from '@/lib/settings';
import SettingsForm from './SettingsForm';

export const metadata = { title: 'Portal ayarları' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireAgency();
  const settings = await loadSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portal ayarları</h1>
        <p className="mt-1 text-sm text-slate-600">
          Giriş ekranında görünen başlık, açıklama metni ve ekip fotoğrafı buradan yönetilir.
        </p>
      </div>

      <SettingsForm settings={settings} currentImageUrl={publicAssetUrl(settings.login_image_path)} />
    </div>
  );
}
