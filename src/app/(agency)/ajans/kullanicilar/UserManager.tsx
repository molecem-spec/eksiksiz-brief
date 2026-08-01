'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Mail, Plus, UserPlus } from 'lucide-react';
import { inviteUser, resendInvite, setUserActive, setUserBrands } from '@/app/actions/admin';
import { cn } from '@/lib/utils';
import type { Company, Profile, UserRole } from '@/types/db';

interface BrandRow {
  id: string;
  name: string;
  company_id: string;
}

interface Props {
  currentUserId: string;
  users: Profile[];
  companies: Pick<Company, 'id' | 'name'>[];
  brands: BrandRow[];
  brandsByUser: Record<string, string[]>;
}

export default function UserManager({
  currentUserId,
  users,
  companies,
  brands,
  brandsByUser,
}: Props) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Davet formu
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [companyId, setCompanyId] = useState('');
  const [brandIds, setBrandIds] = useState<string[]>([]);

  // Yetki duzenleme
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editBrandIds, setEditBrandIds] = useState<string[]>([]);

  const companyName = useMemo(
    () => Object.fromEntries(companies.map((company) => [company.id, company.name])),
    [companies]
  );
  const brandName = useMemo(
    () => Object.fromEntries(brands.map((brand) => [brand.id, brand.name])),
    [brands]
  );

  const inviteBrands = brands.filter((brand) => brand.company_id === companyId);

  async function handleInvite() {
    setBusy(true);
    setMessage(null);
    const result = await inviteUser({
      email,
      fullName,
      role,
      companyId: role === 'client' ? companyId : null,
      brandIds: role === 'client' ? brandIds : [],
    });
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Davet gönderilemedi.' });
      return;
    }
    setMessage({ tone: 'ok', text: `${email} adresine davet gönderildi.` });
    setEmail('');
    setFullName('');
    setBrandIds([]);
    setShowInvite(false);
    router.refresh();
  }

  async function saveBrands() {
    if (!editingUser) return;
    setBusy(true);
    const result = await setUserBrands(editingUser.id, editBrandIds);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Kaydedilemedi.' });
      return;
    }
    setEditingUser(null);
    setMessage({ tone: 'ok', text: 'Marka yetkileri güncellendi.' });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setShowInvite((v) => !v)}>
          <UserPlus className="h-4 w-4" />
          Kullanıcı davet et
        </button>
      </div>

      {showInvite && (
        <div className="card space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="invite-email">
                E-posta
              </label>
              <input
                id="invite-email"
                type="email"
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="invite-name">
                Ad soyad
              </label>
              <input
                id="invite-name"
                className="input mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="invite-role">
                Rol
              </label>
              <select
                id="invite-role"
                className="input mt-1"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="client">Müşteri kullanıcısı</option>
                <option value="agency">Ajans kullanıcısı</option>
              </select>
            </div>
            {role === 'client' && (
              <div>
                <label className="label" htmlFor="invite-company">
                  Müşteri şirketi
                </label>
                <select
                  id="invite-company"
                  className="input mt-1"
                  value={companyId}
                  onChange={(e) => {
                    setCompanyId(e.target.value);
                    setBrandIds([]);
                  }}
                >
                  <option value="">Seçiniz</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {role === 'client' && companyId && (
            <div>
              <p className="label">Erişebileceği markalar</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {inviteBrands.length === 0 && (
                  <span className="text-sm text-slate-400">
                    Bu şirkete henüz marka eklenmemiş.
                  </span>
                )}
                {inviteBrands.map((brand) => (
                  <BrandChip
                    key={brand.id}
                    label={brand.name}
                    active={brandIds.includes(brand.id)}
                    onToggle={() =>
                      setBrandIds((prev) =>
                        prev.includes(brand.id)
                          ? prev.filter((id) => id !== brand.id)
                          : [...prev, brand.id]
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowInvite(false)}>
              Vazgeç
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || !email.trim() || (role === 'client' && !companyId)}
              onClick={handleInvite}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Davet gönder
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={cn(
            'rounded-lg px-3 py-2 text-sm ring-1 ring-inset',
            message.tone === 'ok'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-rose-50 text-rose-700 ring-rose-200'
          )}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Kullanıcı</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Şirket</th>
              <th className="px-4 py-3 font-medium">Markalar</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {users.map((user) => {
              const userBrands = brandsByUser[user.id] ?? [];
              return (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{user.full_name || '—'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'badge',
                        user.role === 'agency'
                          ? 'bg-brand-50 text-brand-700 ring-brand-200'
                          : 'bg-slate-100 text-slate-700 ring-slate-200'
                      )}
                    >
                      {user.role === 'agency' ? 'Ajans' : 'Müşteri'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.company_id ? (companyName[user.company_id] ?? '—') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.role === 'agency' ? (
                      <span className="text-slate-400">Tüm markalar</span>
                    ) : userBrands.length === 0 ? (
                      <span className="text-amber-600">Yetki yok</span>
                    ) : (
                      userBrands.map((id) => brandName[id]).filter(Boolean).join(', ')
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'badge',
                        user.is_active
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-slate-100 text-slate-500 ring-slate-200'
                      )}
                    >
                      {user.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {user.role === 'client' && (
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          onClick={() => {
                            setEditingUser(user);
                            setEditBrandIds(userBrands);
                          }}
                        >
                          Markalar
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost text-xs"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          const result = await resendInvite(user.email);
                          setBusy(false);
                          setMessage(
                            result.ok
                              ? { tone: 'ok', text: 'Giriş bağlantısı gönderildi.' }
                              : { tone: 'error', text: result.error ?? 'Gönderilemedi.' }
                          );
                        }}
                      >
                        Bağlantı gönder
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            await setUserActive(user.id, !user.is_active);
                            setBusy(false);
                            router.refresh();
                          }}
                        >
                          {user.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-medium text-slate-900">Marka yetkileri</h3>
            <p className="mt-1 text-sm text-slate-600">
              {editingUser.full_name || editingUser.email}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {brands
                .filter((brand) => brand.company_id === editingUser.company_id)
                .map((brand) => (
                  <BrandChip
                    key={brand.id}
                    label={brand.name}
                    active={editBrandIds.includes(brand.id)}
                    onToggle={() =>
                      setEditBrandIds((prev) =>
                        prev.includes(brand.id)
                          ? prev.filter((id) => id !== brand.id)
                          : [...prev, brand.id]
                      )
                    }
                  />
                ))}
              {brands.filter((brand) => brand.company_id === editingUser.company_id).length ===
                0 && (
                <p className="text-sm text-slate-400">
                  Kullanıcının şirketinde tanımlı marka yok.
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>
                Vazgeç
              </button>
              <button type="button" className="btn-primary" onClick={saveBrands} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BrandChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-surface-300 bg-white text-slate-700 hover:border-brand-300'
      )}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
