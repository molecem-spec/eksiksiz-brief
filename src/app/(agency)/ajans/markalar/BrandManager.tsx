'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, DownloadCloud, Loader2, Pencil, Plus, Tag, Users } from 'lucide-react';
import { createBrand, setBrandActive, setBrandUsers, updateBrand } from '@/app/actions/admin';
import { importBrandsFromHub } from '@/app/actions/hub';
import { cn } from '@/lib/utils';
import type { Brand, Profile } from '@/types/db';

interface Props {
  brands: Brand[];
  users: Profile[];
  usersByBrand: Record<string, string[]>;
}

export default function BrandManager({ brands, users, usersByBrand }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ name: '', contactEmail: '', notes: '' });

  const [editing, setEditing] = useState<Brand | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', contactEmail: '', notes: '' });

  const [assigning, setAssigning] = useState<Brand | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);

  const agencyUsers = users.filter((user) => user.role === 'agency');
  const clientUsers = users.filter((user) => user.role === 'client');

  async function handleCreate() {
    setBusy(true);
    setMessage(null);
    const result = await createBrand(draft.name, draft.contactEmail, draft.notes);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Eklenemedi.' });
      return;
    }
    setDraft({ name: '', contactEmail: '', notes: '' });
    setShowNew(false);
    router.refresh();
  }

  async function handleUpdate() {
    if (!editing) return;
    setBusy(true);
    const result = await updateBrand(editing.id, editDraft);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Güncellenemedi.' });
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function handleAssign() {
    if (!assigning) return;
    setBusy(true);
    const result = await setBrandUsers(assigning.id, assignedIds);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error ?? 'Kaydedilemedi.' });
      return;
    }
    setAssigning(null);
    setMessage({ tone: 'ok', text: 'Marka ekibi güncellendi.' });
    router.refresh();
  }

  const nameOf = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return null;
    const base = user.full_name || user.email;
    return user.team_name ? `${base} · ${user.team_name}` : base;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMessage(null);
            const result = await importBrandsFromHub();
            setBusy(false);
            if (!result.ok || !result.data) {
              setMessage({ tone: 'error', text: result.error ?? 'Markalar alınamadı.' });
              return;
            }
            const { added, existing, names } = result.data;
            setMessage({
              tone: 'ok',
              text:
                added === 0
                  ? `Hub’daki ${existing} markanın tamamı zaten tanımlı.`
                  : `${added} marka eklendi: ${names.join(', ')}`,
            });
            router.refresh();
          }}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DownloadCloud className="h-4 w-4" />
          )}
          Hub’dan markaları al
        </button>

        <button type="button" className="btn-primary" onClick={() => setShowNew((v) => !v)}>
          <Plus className="h-4 w-4" />
          Yeni marka
        </button>
      </div>

      {showNew && (
        <div className="card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="brand-name">
                Marka adı
              </label>
              <input
                id="brand-name"
                className="input mt-1.5"
                placeholder="Örn. Dürümle"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="brand-email">
                İletişim e-postası (isteğe bağlı)
              </label>
              <input
                id="brand-email"
                type="email"
                className="input mt-1.5"
                value={draft.contactEmail}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="brand-notes">
              Notlar (isteğe bağlı)
            </label>
            <textarea
              id="brand-notes"
              rows={2}
              className="input mt-1.5"
              placeholder="Ajans içi notlar. Marka ekibi görmez."
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>
              Vazgeç
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreate}
              disabled={busy || !draft.name.trim()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ekle
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

      {brands.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          Henüz marka eklenmemiş.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {brands.map((brand) => {
            const assigned = usersByBrand[brand.id] ?? [];
            const agencyMembers = assigned.filter((id) =>
              agencyUsers.some((user) => user.id === id)
            );
            const clientMembers = assigned.filter((id) =>
              clientUsers.some((user) => user.id === id)
            );

            return (
              <div key={brand.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
                      <Tag className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{brand.name}</p>
                      <p className="text-xs text-slate-500">
                        {brand.contact_email || 'İletişim e-postası yok'}
                      </p>
                      {!brand.is_active && (
                        <span className="badge mt-1 bg-surface-100 text-slate-500 ring-surface-300">
                          Pasif
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-ghost px-2"
                    title="Düzenle"
                    onClick={() => {
                      setEditing(brand);
                      setEditDraft({
                        name: brand.name,
                        contactEmail: brand.contact_email ?? '',
                        notes: brand.notes ?? '',
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Ajans sorumluları
                    </p>
                    <p className="text-slate-700">
                      {agencyMembers.length
                        ? agencyMembers.map(nameOf).filter(Boolean).join(', ')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Marka ekibi
                    </p>
                    <p className="text-slate-700">
                      {clientMembers.length
                        ? clientMembers.map(nameOf).filter(Boolean).join(', ')
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => {
                      setAssigning(brand);
                      setAssignedIds(assigned);
                    }}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Ekipleri düzenle
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await setBrandActive(brand.id, !brand.is_active);
                      setBusy(false);
                      router.refresh();
                    }}
                  >
                    {brand.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Marka duzenleme */}
      {editing && (
        <Modal title="Markayı düzenle" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div>
              <label className="label">Marka adı</label>
              <input
                className="input mt-1.5"
                value={editDraft.name}
                onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">İletişim e-postası</label>
              <input
                type="email"
                className="input mt-1.5"
                value={editDraft.contactEmail}
                onChange={(e) => setEditDraft({ ...editDraft, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notlar</label>
              <textarea
                rows={3}
                className="input mt-1.5"
                value={editDraft.notes}
                onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
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

      {/* Ekip atama */}
      {assigning && (
        <Modal title={`${assigning.name} · ekipler`} onClose={() => setAssigning(null)}>
          <p className="text-sm text-slate-600">
            Ajans kullanıcıları bu markanın sorumlusu olur; marka kullanıcıları bu markayı görebilir
            ve adına talep açabilir.
          </p>

          <div className="mt-4 space-y-4">
            <UserPicker
              title="Ajans sorumluları"
              users={agencyUsers}
              selected={assignedIds}
              onToggle={(id) =>
                setAssignedIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
            <UserPicker
              title="Marka ekibi"
              users={clientUsers}
              selected={assignedIds}
              onToggle={(id) =>
                setAssignedIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAssigning(null)}>
              Vazgeç
            </button>
            <button type="button" className="btn-primary" onClick={handleAssign} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Kaydet
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UserPicker({
  title,
  users,
  selected,
  onToggle,
}: {
  title: string;
  users: Profile[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {users.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400">Bu rolde aktif kullanıcı yok.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {users.map((user) => {
            const active = selected.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onToggle(user.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-surface-300 bg-white text-slate-700 hover:border-brand-300'
                )}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {user.full_name || user.email}
                {user.team_name && (
                  <span className={active ? 'opacity-80' : 'text-slate-400'}>
                    · {user.team_name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
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
