'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Inbox, Search } from 'lucide-react';
import { STATUS_META, STATUS_ORDER } from '@/lib/status';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { RequestListItem, RequestStatus, UserRole } from '@/types/db';
import { PriorityBadge, StatusBadge } from './StatusBadge';

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
}

export default function RequestList({
  requests,
  role,
  detailBase,
  brands,
  assignees = [],
}: Props) {
  const isAgency = role === 'agency';

  const [status, setStatus] = useState<RequestStatus | 'all'>('all');
  const [brandId, setBrandId] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [useDateTo, setUseDateTo] = useState('');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const map: Partial<Record<RequestStatus, number>> = {};
    for (const request of requests) {
      map[request.status] = (map[request.status] ?? 0) + 1;
    }
    return map;
  }, [requests]);

  const visibleStatuses = useMemo(
    () => STATUS_ORDER.filter((s) => (isAgency ? s !== 'draft' || counts.draft : true)),
    [isAgency, counts.draft]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr');
    return requests.filter((request) => {
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
  }, [requests, status, brandId, assignee, from, to, useDateTo, query]);

  return (
    <div className="space-y-4">
      {/* Durum sekmeleri */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus('all')}
          className={cn(
            'rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
            status === 'all'
              ? 'bg-brand-gradient text-white shadow-glow'
              : 'bg-white text-slate-600 ring-1 ring-inset ring-surface-200 hover:bg-brand-50'
          )}
        >
          Tümü <span className="ml-1 opacity-70">{requests.length}</span>
        </button>
        {visibleStatuses.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={cn(
              'rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
              status === value
                ? 'bg-brand-gradient text-white shadow-glow'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-surface-200 hover:bg-brand-50'
            )}
          >
            {isAgency ? STATUS_META[value].label : STATUS_META[value].clientLabel}
            <span className="ml-1 opacity-70">{counts[value] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Filtreler */}
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-10"
              placeholder="Talep ara (başlık, marka, talep no…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="all">Tüm markalar</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          {isAgency && (
            <select
              className="input"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="all">Tüm sorumlular</option>
              <option value="none">Atanmamış</option>
              {assignees.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          )}

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
          <label className="text-xs font-medium text-slate-500">
            Yayın tarihi (en geç)
            <input
              type="date"
              className="input mt-1"
              value={useDateTo}
              onChange={(e) => setUseDateTo(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <Inbox className="h-8 w-8 text-brand-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Talep bulunamadı</p>
          <p className="mt-1 text-sm text-slate-500">
            Filtreleri değiştirin veya yeni bir iş talebi oluşturun.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Talep</th>
                  <th className="px-4 py-3 font-semibold">Marka</th>
                  <th className="px-4 py-3 font-semibold">Talep tarihi</th>
                  <th className="px-4 py-3 font-semibold">Yayın tarihi</th>
                  {isAgency && <th className="px-4 py-3 font-semibold">Teslim</th>}
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  {isAgency && <th className="px-4 py-3 font-semibold">Sorumlu</th>}
                  <th className="px-4 py-3 font-semibold">Son güncelleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {filtered.map((request) => (
                  <tr key={request.id} className="transition-colors hover:bg-brand-50/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`${detailBase}/${request.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-700"
                      >
                        {request.title || 'İsimsiz talep'}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>#{request.ref}</span>
                        <PriorityBadge priority={request.priority} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{request.brand?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(request.submitted_at ?? request.created_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(request.use_date)}</td>
                    {isAgency && (
                      <td className="px-4 py-3 text-slate-500">{formatDate(request.deadline)}</td>
                    )}
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} />
                    </td>
                    {isAgency && (
                      <td className="px-4 py-3 text-slate-600">
                        {request.assignee?.full_name ?? (
                          <span className="text-slate-400">Atanmadı</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-500">{formatDate(request.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobil kart gorunumu */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((request) => (
              <Link
                key={request.id}
                href={`${detailBase}/${request.id}`}
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

          <p className="text-xs text-slate-500">
            {filtered.length} talep gösteriliyor (toplam {requests.length}).
          </p>
        </>
      )}
    </div>
  );
}
