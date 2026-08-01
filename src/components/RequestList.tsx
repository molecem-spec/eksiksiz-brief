'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Inbox, Search, SlidersHorizontal, X } from 'lucide-react';
import { useStoredValue } from '@/hooks/useStoredValue';
import { STATUS_META, STATUS_ORDER } from '@/lib/status';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { RequestListItem, RequestStatus, UserRole } from '@/types/db';
import { PriorityBadge, StatusBadge } from './StatusBadge';

/** Gorunum tercihi tarayiciya ozel saklanir. */
const SCOPE_KEY = 'eb.talep-kapsami';

interface Option {
  id: string;
  name: string;
}

interface Props {
  requests: RequestListItem[];
  role: UserRole;
  /** Talep detay adresinin on eki: /talep veya /ajans/talep */
  detailBase: string;
  brands: Option[];
  assignees?: Option[];
  /** Ajans kullanicisinin sorumlu oldugu markalar (gorunum ayari icin) */
  myBrandIds?: string[];
}

export default function RequestList({
  requests,
  role,
  detailBase,
  brands,
  assignees = [],
  myBrandIds,
}: Props) {
  const isAgency = role === 'agency';
  const canScope = isAgency && Array.isArray(myBrandIds);

  const [scope, setScope] = useStoredValue(SCOPE_KEY, 'all');
  const [status, setStatus] = useState<RequestStatus | 'all'>('all');
  const [brandId, setBrandId] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [useDateTo, setUseDateTo] = useState('');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Taslakta yapilacak tek is forma devam etmek; marka tarafinda taslaklar
   * dogrudan forma baglanir.
   */
  const linkFor = (request: RequestListItem) =>
    !isAgency && request.status === 'draft'
      ? `/yeni-talep/${request.id}`
      : `${detailBase}/${request.id}`;

  // Kapsam once uygulanir; durum sayaclari da bu kapsama gore hesaplanir.
  const inScope = useMemo(() => {
    if (!canScope || scope !== 'mine') return requests;
    const mine = new Set(myBrandIds);
    return requests.filter((request) => mine.has(request.brand_id));
  }, [requests, canScope, scope, myBrandIds]);

  const counts = useMemo(() => {
    const map: Partial<Record<RequestStatus, number>> = {};
    for (const request of inScope) {
      map[request.status] = (map[request.status] ?? 0) + 1;
    }
    return map;
  }, [inScope]);

  const visibleStatuses = useMemo(
    () => STATUS_ORDER.filter((s) => (isAgency ? s !== 'draft' || counts.draft : true)),
    [isAgency, counts.draft]
  );

  const activeFilters =
    (brandId !== 'all' ? 1 : 0) +
    (assignee !== 'all' ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (useDateTo ? 1 : 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr');
    return inScope.filter((request) => {
      if (status !== 'all' && request.status !== status) return false;
      if (brandId !== 'all' && request.brand_id !== brandId) return false;
      if (assignee !== 'all') {
        if (assignee === 'none' ? request.assigned_to !== null : request.assigned_to !== assignee) {
          return false;
        }
      }
      if (from && request.created_at.slice(0, 10) < from) return false;
      if (to && request.created_at.slice(0, 10) > to) return false;
      if (useDateTo && (!request.use_date || request.use_date > useDateTo)) return false;
      if (needle) {
        const haystack = [request.title, request.brand?.name, `#${request.ref}`]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr');
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [inScope, status, brandId, assignee, from, to, useDateTo, query]);

  function clearFilters() {
    setBrandId('all');
    setAssignee('all');
    setFrom('');
    setTo('');
    setUseDateTo('');
  }

  return (
    <div className="space-y-3">
      {/* Kapsam + arama + filtre acma */}
      <div className="flex flex-wrap items-center gap-2">
        {canScope && (
          <div className="inline-flex rounded-xl bg-surface-100 p-0.5">
            {(
              [
                ['all', 'Tüm talepler'],
                ['mine', 'Sorumlu olduklarım'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className={cn(
                  'rounded-[0.6rem] px-3 py-1.5 text-sm font-semibold transition-colors',
                  scope === value
                    ? 'bg-white text-brand-700 shadow-card'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="input pl-10"
            placeholder="Talep ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={cn('btn-secondary shrink-0', activeFilters > 0 && 'border-brand-300 bg-brand-50')}
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtreler
          {activeFilters > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Durum cipleri */}
      <div className="flex flex-wrap gap-1.5">
        <StatusChip active={status === 'all'} onClick={() => setStatus('all')}>
          Tümü <Count>{inScope.length}</Count>
        </StatusChip>
        {visibleStatuses.map((value) => (
          <StatusChip
            key={value}
            active={status === value}
            onClick={() => setStatus(value)}
          >
            {isAgency ? STATUS_META[value].label : STATUS_META[value].clientLabel}
            <Count>{counts[value] ?? 0}</Count>
          </StatusChip>
        ))}
      </div>

      {/* Acilir filtreler */}
      {showFilters && (
        <div className="card p-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-medium text-slate-500">
              Marka
              <select
                className="input mt-1"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="all">Tümü</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            {isAgency && (
              <label className="text-xs font-medium text-slate-500">
                Sorumlu
                <select
                  className="input mt-1"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <option value="all">Tümü</option>
                  <option value="none">Atanmamış</option>
                  {assignees.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="text-xs font-medium text-slate-500">
              Yayın tarihi (en geç)
              <input
                type="date"
                className="input mt-1"
                value={useDateTo}
                onChange={(e) => setUseDateTo(e.target.value)}
              />
            </label>

            <label className="text-xs font-medium text-slate-500">
              Talep tarihi (başlangıç)
              <input
                type="date"
                className="input mt-1"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>

            <label className="text-xs font-medium text-slate-500">
              Talep tarihi (bitiş)
              <input
                type="date"
                className="input mt-1"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>

          {activeFilters > 0 && (
            <button type="button" className="btn-ghost mt-2 text-xs" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Filtreleri temizle
            </button>
          )}
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <Inbox className="h-7 w-7 text-brand-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Talep bulunamadı</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {canScope && scope === 'mine' && myBrandIds?.length === 0
              ? 'Size henüz sorumlu olduğunuz bir marka atanmamış. Markalar sayfasından atama yapabilirsiniz.'
              : 'Filtreleri değiştirmeyi deneyin.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Talep</th>
                  <th className="px-4 py-2.5 font-semibold">Marka</th>
                  <th className="px-4 py-2.5 font-semibold">İletildi</th>
                  <th className="px-4 py-2.5 font-semibold">Yayın</th>
                  {isAgency && <th className="px-4 py-2.5 font-semibold">Teslim</th>}
                  <th className="px-4 py-2.5 font-semibold">Durum</th>
                  {isAgency && <th className="px-4 py-2.5 font-semibold">Sorumlu</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {filtered.map((request) => (
                  <tr key={request.id} className="transition-colors hover:bg-brand-50/50">
                    <td className="px-4 py-2.5">
                      <Link
                        href={linkFor(request)}
                        className="font-semibold text-slate-900 hover:text-brand-700"
                      >
                        {request.title || 'İsimsiz talep'}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <span>#{request.ref}</span>
                        {request.priority !== 'normal' && (
                          <PriorityBadge priority={request.priority} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{request.brand?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {formatDate(request.submitted_at ?? request.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{formatDate(request.use_date)}</td>
                    {isAgency && (
                      <td className="px-4 py-2.5 text-slate-500">{formatDate(request.deadline)}</td>
                    )}
                    <td className="px-4 py-2.5">
                      <StatusBadge status={request.status} />
                    </td>
                    {isAgency && (
                      <td className="px-4 py-2.5 text-slate-600">
                        {request.assignee?.full_name ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobil kart gorunumu */}
          <div className="space-y-2.5 lg:hidden">
            {filtered.map((request) => (
              <Link
                key={request.id}
                href={linkFor(request)}
                className="card block p-4 transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {request.title || 'İsimsiz talep'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      #{request.ref} · {request.brand?.name ?? '—'}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <dt className="text-slate-400">Talep tarihi</dt>
                    <dd>{formatDate(request.submitted_at ?? request.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Yayın tarihi</dt>
                    <dd>{formatDate(request.use_date)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400">Son güncelleme</dt>
                    <dd>{formatDateTime(request.updated_at)}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            {filtered.length} talep
            {filtered.length !== inScope.length && ` (${inScope.length} içinden)`}
          </p>
        </>
      )}
    </div>
  );
}

function StatusChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
        active
          ? 'bg-brand-gradient text-white'
          : 'bg-white text-slate-600 ring-1 ring-inset ring-surface-200 hover:bg-brand-50'
      )}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="opacity-60">{children}</span>;
}
