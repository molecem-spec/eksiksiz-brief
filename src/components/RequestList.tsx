'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Inbox } from 'lucide-react';
import { PROJECT_TYPES, projectTypeLabel } from '@/lib/brief';
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
  companies?: Option[];
  assignees?: Option[];
}

export default function RequestList({
  requests,
  role,
  detailBase,
  brands,
  companies = [],
  assignees = [],
}: Props) {
  const isAgency = role === 'agency';

  const [status, setStatus] = useState<RequestStatus | 'all'>('all');
  const [brandId, setBrandId] = useState('all');
  const [companyId, setCompanyId] = useState('all');
  const [type, setType] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');
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
      if (companyId !== 'all' && request.company_id !== companyId) return false;
      if (type !== 'all' && request.project_type !== type) return false;
      if (assignee !== 'all') {
        if (assignee === 'none' ? request.assigned_to !== null : request.assigned_to !== assignee) {
          return false;
        }
      }
      if (from && request.created_at.slice(0, 10) < from) return false;
      if (to && request.created_at.slice(0, 10) > to) return false;
      if (deadlineTo && (!request.deadline || request.deadline > deadlineTo)) return false;
      if (needle) {
        const haystack = [
          request.title,
          request.brand?.name,
          request.company?.name,
          projectTypeLabel(request.project_type),
          `#${request.ref}`,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('tr');
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [requests, status, brandId, companyId, type, assignee, from, to, deadlineTo, query]);

  return (
    <div className="space-y-4">
      {/* Durum sekmeleri */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus('all')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            status === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-white text-slate-600 ring-1 ring-inset ring-surface-200 hover:bg-surface-100'
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
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              status === value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-surface-200 hover:bg-surface-100'
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
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Talep ara (başlık, marka, talep no…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {isAgency && (
            <select
              className="input"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="all">Tüm müşteri şirketleri</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}

          <select className="input" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="all">Tüm markalar</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Tüm talep türleri</option>
            {PROJECT_TYPES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
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

          <label className="text-xs text-slate-500">
            Talep tarihi (başlangıç)
            <input
              type="date"
              className="input mt-1"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-500">
            Talep tarihi (bitiş)
            <input
              type="date"
              className="input mt-1"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-500">
            Teslim tarihi (en geç)
            <input
              type="date"
              className="input mt-1"
              value={deadlineTo}
              onChange={(e) => setDeadlineTo(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Talep bulunamadı</p>
          <p className="mt-1 text-sm text-slate-500">
            Filtreleri değiştirin veya yeni bir iş talebi oluşturun.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Talep</th>
                  {isAgency && <th className="px-4 py-3 font-medium">Müşteri</th>}
                  <th className="px-4 py-3 font-medium">Marka</th>
                  <th className="px-4 py-3 font-medium">Tür</th>
                  <th className="px-4 py-3 font-medium">Oluşturma</th>
                  <th className="px-4 py-3 font-medium">Yayın / etkinlik</th>
                  <th className="px-4 py-3 font-medium">Teslim</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  {isAgency && <th className="px-4 py-3 font-medium">Sorumlu</th>}
                  <th className="px-4 py-3 font-medium">Son güncelleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200">
                {filtered.map((request) => (
                  <tr key={request.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`${detailBase}/${request.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {request.title || 'İsimsiz talep'}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <span>#{request.ref}</span>
                        <PriorityBadge priority={request.priority} />
                      </div>
                    </td>
                    {isAgency && (
                      <td className="px-4 py-3 text-slate-600">{request.company?.name ?? '—'}</td>
                    )}
                    <td className="px-4 py-3 text-slate-600">{request.brand?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {projectTypeLabel(request.project_type)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(request.use_date)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(request.deadline)}</td>
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
                    <p className="font-medium text-slate-900">
                      {request.title || 'İsimsiz talep'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      #{request.ref} · {request.brand?.name ?? '—'}
                      {isAgency && request.company ? ` · ${request.company.name}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <dt className="text-slate-400">Tür</dt>
                    <dd>{projectTypeLabel(request.project_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Teslim</dt>
                    <dd>{formatDate(request.deadline)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Yayın / etkinlik</dt>
                    <dd>{formatDate(request.use_date)}</dd>
                  </div>
                  <div>
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
