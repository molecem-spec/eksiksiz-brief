import Link from 'next/link';
import { LogOut } from 'lucide-react';
import type { Profile } from '@/types/db';
import NavLink from './NavLink';

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  profile: Profile;
  companyName?: string | null;
  nav: NavItem[];
  children: React.ReactNode;
}

export default function AppShell({ profile, companyName, nav, children }: Props) {
  const isAgency = profile.role === 'agency';

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="no-print sticky top-0 z-30 border-b border-surface-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href={isAgency ? '/ajans' : '/panel'} className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
              EB
            </span>
            <span className="hidden text-sm font-semibold text-slate-900 sm:block">
              Eksiksiz Brif
            </span>
          </Link>

          {isAgency && (
            <span className="badge bg-brand-50 text-brand-700 ring-brand-200">Ajans</span>
          )}

          <nav className="ml-2 flex flex-1 items-center gap-1 overflow-x-auto">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-slate-800">
                {profile.full_name || profile.email}
              </p>
              {companyName && <p className="text-xs leading-tight text-slate-500">{companyName}</p>}
            </div>
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
