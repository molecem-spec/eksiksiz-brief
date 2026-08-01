import Link from 'next/link';
import { KeyRound, LogOut } from 'lucide-react';
import type { Profile } from '@/types/db';
import NavLink from './NavLink';
import NotificationBell from './NotificationBell';

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  profile: Profile;
  appName: string;
  /** Ust barda kisi adinin altinda gosterilecek satir (ekip veya markalar) */
  subline?: string | null;
  nav: NavItem[];
  children: React.ReactNode;
}

export default function AppShell({ profile, appName, subline, nav, children }: Props) {
  const isAgency = profile.role === 'agency';
  const home = isAgency ? '/ajans' : '/panel';

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-surface-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href={home} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white shadow-glow">
              18
            </span>
            <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:block">
              {appName}
            </span>
          </Link>

          {isAgency && (
            <span className="badge bg-brand-50 text-brand-700 ring-brand-200">Ajans</span>
          )}

          <nav className="ml-1 flex flex-1 items-center gap-1 overflow-x-auto">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-800">
                {profile.full_name || profile.email}
              </p>
              {subline && (
                <p className="max-w-[220px] truncate text-xs leading-tight text-slate-500">
                  {subline}
                </p>
              )}
            </div>

            {/* Bildirimler su an ajans tarafina uretiliyor. */}
            {isAgency && <NotificationBell userId={profile.id} />}

            <Link href="/sifre" className="btn-ghost px-2" title="Şifre değiştir">
              <KeyRound className="h-4 w-4" />
            </Link>

            <form action="/auth/cikis" method="post">
              <button
                type="submit"
                className="btn-ghost px-2"
                title="Çıkış yap"
                aria-label="Çıkış yap"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
