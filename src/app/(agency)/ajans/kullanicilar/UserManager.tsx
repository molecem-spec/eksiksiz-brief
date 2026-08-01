'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, KeyRound, Loader2, Trash2, UserPlus } from 'lucide-react';
import {
  createUser,
  deleteUser,
  resetUserPassword,
  setUserActive,
  setUserBrands,
  updateUser,
} from '@/app/actions/admin';
import { cn } from '@/lib/utils';
import type { Brand, Profile, UserRole } from '@/types/db';

interface Props {
  currentUserId: string;
  users: Profile[];
  brands: Brand[];
  brandsByUser: Record<string, string[]>;
}

/** Okunmasi kolay, rastgele bir baslangic sifresi uretir. */
function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

const EMPTY_DRAFT = {
  email: '',
  fullName: '',
  teamName: '',
  role: 'client' as UserRole,
  password: '',
  brandIds: [] as string[],
};

export default function UserManager({ currentUserId, users, brands, brandsByUser }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const [editing, setEditing] = useState<Profile | null>(null);
  const [editDraft, setEditDraft] = useState({
    fullName: '',
    teamName: '',
    role: 'client' as UserRole,
    brandIds: [] as string[],
  });

  const [resetting, setResetting] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const brandName = useMemo(
    () => Object.fromEntries(brands.map((brand) => [brand.id, brand.name])),
    [brands]
  );

  async function handleCreate() {
    setBusy(true);
    setMessage(null);
    const result = await createUser(draft);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Oluşturulamadı.' });
      return;
    }
    setCreated({ email: draft.email.trim().toLowerCase(), password: draft.password });
    setDraft(EMPTY_DRAFT);
    setShowNew(false);
    router.refresh();
  }

  async function handleUpdate() {
    if (!editing) return;
    setBusy(true);
    const profileResult = await updateUser(editing.id, {
      fullName: editDraft.fullName,
      teamName: editDraft.teamName,
      role: editDraft.role,
    });
    if (!profileResult.ok) {
      setBusy(false);
      setMessage({ tone: 'error', text: profileResult.error ?? 'Güncellenemedi.' });
      return;
    }
    const brandResult = await setUserBrands(editing.id, editDraft.brandIds);
    setBusy(false);
    if (!brandResult.ok) {
      setMessage({ tone: 'error', text: brandResult.error ?? 'Markalar kaydedilemedi.' });
      return;
    }
    setEditing(null);
    setMessage({ tone: 'ok', text: 'Kullanıcı güncellendi.' });
    router.refresh();
  }

  async function handleReset() {
    if (!resetting) return;
    setBusy(true);
    const result = await resetUserPassword(resetting.id, newPassword);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Şifre değiştirilemedi.' });
      return;
    }
    setCreated({ email: resetting.email, password: newPassword });
    setResetting(null);
    setNewPassword('');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setShowNew((v) => !v);
            setDraft({ ...EMPTY_DRAFT, password: generatePassword() });
          }}
        >
          <UserPlus className="h-4 w-4" />
          Yeni kullanıcı ekle
        </button>
      </div>

      {/* Olusturma sonrasi sifre kutusu */}
      {created && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Hesap hazır</p>
          <p className="mt-1 text-sm text-emerald-800">
            Bu bilgileri kullanıcıya iletin. Şifre bir daha gösterilmeyecek.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-800 ring-1 ring-inset ring-emerald-200">
              {created.email}
            </code>
            <code className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 ring-1 ring-inset ring-emerald-200">
              {created.password}
            </code>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() =>
                navigator.clipboard.writeText(
                  `E-posta: ${created.email}\nŞifre: ${created.password}`
                )
              }
            >
              <Copy className="h-3.5 w-3.5" />
              Kopyala
            </button>
            <button type="button" className="btn-ghost text-xs" onClick={() => setCreated(null)}>
              Kapat
            </button>
          </div>
        </div>
      )}

      {showNew && (
        <div className="card space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="new-email">
                E-posta
              </label>
              <input
                id="new-email"
                type="email"
                className="input mt-1.5"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="new-name">
                Ad soyad
              </label>
              <input
                id="new-name"
                className="input mt-1.5"
                placeholder="Örn. Ecem"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="new-team">
                Ekip
              </label>
              <input
                id="new-team"
                className="input mt-1.5"
                placeholder="Örn. 18.12 Art Ekibi"
                value={draft.teamName}
                onChange={(e) => setDraft({ ...draft, teamName: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="new-role">
                Rol
              </label>
              <select
                id="new-role"
                className="input mt-1.5"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })}
              >
                <option value="client">Marka kullanıcısı</option>
                <option value="agency">Ajans kullanıcısı</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="new-password">
              Başlangıç şifresi
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="new-password"
                className="input font-mono"
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              />
              <button
                type="button"
                className="btn-secondary shrink-0"
                onClick={() => setDraft({ ...draft, password: generatePassword() })}
              >
                Rastgele üret
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              En az 8 karakter. Kullanıcı panelden kendi şifresini değiştirebilir.
            </p>
          </div>

          <div>
            <p className="label">
              {draft.role === 'agency' ? 'Sorumlu olduğu markalar' : 'Erişebileceği markalar'}
            </p>
            <BrandPicker
              brands={brands}
              selected={draft.brandIds}
              onToggle={(id) =>
                setDraft({
                  ...draft,
                  brandIds: draft.brandIds.includes(id)
                    ? draft.brandIds.filter((x) => x !== id)
                    : [...draft.brandIds, id],
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>
              Vazgeç
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || !draft.email.trim() || draft.password.length < 8}
              onClick={handleCreate}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Kullanıcıyı oluştur
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={cn(
            'rounded-xl px-3 py-2 text-sm ring-1 ring-inset',
            message.tone === 'ok'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-blossom-50 text-blossom-700 ring-blossom-200'
          )}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-surface-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="px-4 py-3 font-semibold">Ekip</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold">Markalar</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {users.map((user) => {
              const userBrands = brandsByUser[user.id] ?? [];
              return (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{user.full_name || '—'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.team_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'badge',
                        user.role === 'agency'
                          ? 'bg-brand-50 text-brand-700 ring-brand-200'
                          : 'bg-blossom-50 text-blossom-700 ring-blossom-200'
                      )}
                    >
                      {user.role === 'agency' ? 'Ajans' : 'Marka'}
                    </span>
                  </td>
                  <td className="max-w-[240px] px-4 py-3 text-slate-600">
                    {userBrands.length === 0 ? (
                      <span className={user.role === 'client' ? 'text-peach-600' : 'text-slate-400'}>
                        {user.role === 'client' ? 'Yetki yok' : '—'}
                      </span>
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
                          : 'bg-surface-100 text-slate-500 ring-surface-300'
                      )}
                    >
                      {user.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        className="btn-ghost text-xs"
                        onClick={() => {
                          setEditing(user);
                          setEditDraft({
                            fullName: user.full_name,
                            teamName: user.team_name,
                            role: user.role,
                            brandIds: userBrands,
                          });
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-xs"
                        onClick={() => {
                          setResetting(user);
                          setNewPassword(generatePassword());
                        }}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Şifre
                      </button>
                      {user.id !== currentUserId && (
                        <>
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
                          <button
                            type="button"
                            className="btn-ghost px-2 text-xs text-blossom-600"
                            disabled={busy}
                            title="Kullanıcıyı sil"
                            onClick={async () => {
                              if (
                                !confirm(
                                  `${user.full_name || user.email} silinsin mi? Bu işlem geri alınamaz.`
                                )
                              )
                                return;
                              setBusy(true);
                              const result = await deleteUser(user.id);
                              setBusy(false);
                              if (!result.ok) {
                                setMessage({ tone: 'error', text: result.error ?? 'Silinemedi.' });
                                return;
                              }
                              router.refresh();
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Kullanici duzenleme */}
      {editing && (
        <Modal title="Kullanıcıyı düzenle" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">{editing.email}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Ad soyad</label>
                <input
                  className="input mt-1.5"
                  value={editDraft.fullName}
                  onChange={(e) => setEditDraft({ ...editDraft, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Ekip</label>
                <input
                  className="input mt-1.5"
                  placeholder="Örn. 18.12 Art Ekibi"
                  value={editDraft.teamName}
                  onChange={(e) => setEditDraft({ ...editDraft, teamName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Rol</label>
              <select
                className="input mt-1.5"
                value={editDraft.role}
                onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value as UserRole })}
              >
                <option value="client">Marka kullanıcısı</option>
                <option value="agency">Ajans kullanıcısı</option>
              </select>
            </div>
            <div>
              <p className="label">
                {editDraft.role === 'agency' ? 'Sorumlu olduğu markalar' : 'Erişebileceği markalar'}
              </p>
              <BrandPicker
                brands={brands}
                selected={editDraft.brandIds}
                onToggle={(id) =>
                  setEditDraft({
                    ...editDraft,
                    brandIds: editDraft.brandIds.includes(id)
                      ? editDraft.brandIds.filter((x) => x !== id)
                      : [...editDraft.brandIds, id],
                  })
                }
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Vazgeç
            </button>
            <button type="button" className="btn-primary" onClick={handleUpdate} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Kaydet
            </button>
          </div>
        </Modal>
      )}

      {/* Sifre sifirlama */}
      {resetting && (
        <Modal title="Şifreyi yeniden belirle" onClose={() => setResetting(null)}>
          <p className="text-sm text-slate-600">
            {resetting.full_name || resetting.email} için yeni bir şifre belirleyin ve kendisine
            iletin.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              className="input font-mono"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => setNewPassword(generatePassword())}
            >
              Rastgele üret
            </button>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setResetting(null)}>
              Vazgeç
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleReset}
              disabled={busy || newPassword.length < 8}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Şifreyi değiştir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BrandPicker({
  brands,
  selected,
  onToggle,
}: {
  brands: Brand[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (brands.length === 0) {
    return <p className="mt-2 text-sm text-slate-400">Henüz marka eklenmemiş.</p>;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {brands.map((brand) => {
        const active = selected.includes(brand.id);
        return (
          <button
            key={brand.id}
            type="button"
            onClick={() => onToggle(brand.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
              active
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-surface-300 bg-white text-slate-700 hover:border-brand-300'
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {brand.name}
          </button>
        );
      })}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button type="button" className="btn-ghost px-2 text-xs" onClick={onClose}>
            Kapat
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
