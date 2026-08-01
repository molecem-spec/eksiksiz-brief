import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

/** Giris sonrasi role gore dogru panele yonlendirir. */
export default async function HomePage() {
  const { profile } = await requireUser();
  redirect(profile.role === 'agency' ? '/ajans' : '/panel');
}
