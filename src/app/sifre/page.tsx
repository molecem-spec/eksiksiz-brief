import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import PasswordForm from './PasswordForm';

export const metadata = { title: 'Şifre değiştir' };
export const dynamic = 'force-dynamic';

export default async function PasswordPage() {
  const { profile } = await requireUser();
  const home = profile.role === 'agency' ? '/ajans' : '/panel';

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Link
        href={home}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Panele dön
      </Link>

      <div className="card mt-4 p-6">
        <h1 className="section-title">Şifre değiştir</h1>
        <p className="mt-2 text-sm text-slate-600">
          {profile.full_name || profile.email} hesabı için yeni bir şifre belirleyin.
        </p>

        <div className="mt-5">
          <PasswordForm />
        </div>
      </div>
    </main>
  );
}
