'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={cn(
        'whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-brand-100 text-brand-800'
          : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
      )}
    >
      {children}
    </Link>
  );
}
