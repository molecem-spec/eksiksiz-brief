'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn, formatDateTime } from '@/lib/utils';
import type { AppNotification } from '@/types/notification';

const PAGE_SIZE = 25;

type Permission = 'default' | 'granted' | 'denied' | 'unsupported';

/** Tarayicinin bildirim izni. Sunucuda calisirsa 'default' doner. */
function readPermission(): Permission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as Permission;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<Permission>('default');
  const boxRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((item) => !item.read_at).length;

  /** Masaustu bildirimi. Izin yoksa veya sekme onde ise sessiz kalir. */
  const showDesktopNotification = useCallback(
    (item: AppNotification) => {
      if (readPermission() !== 'granted') return;
      // Sekme onde ve odaktaysa rozet zaten guncelleniyor; ustune masaustu
      // bildirimi cikarmiyoruz.
      if (document.visibilityState === 'visible' && document.hasFocus()) return;

      try {
        const notification = new Notification(item.title, {
          body: item.body ?? undefined,
          tag: item.id,
          icon: '/icon.svg',
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
          if (item.request_id) router.push(`/ajans/talep/${item.request_id}`);
        };
      } catch {
        // Bazi tarayicilar arka planda Notification kurmayi engelliyor.
      }
    },
    [router]
  );

  // --- Ilk yukleme + periyodik tazeleme ------------------------------------
  // Realtime baglantisi kurulamazsa (ag, proxy, yapilandirma) zil sessiz
  // kalmasin diye dakikada bir de tazeleniyor.
  useEffect(() => {
    let active = true;

    async function fetchItems() {
      const supabase = createClient();
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!active) return;
      setItems((data ?? []) as AppNotification[]);
      setLoading(false);
    }

    fetchItems();
    const timer = setInterval(fetchItems, 60_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // --- Canli bildirim ------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const item = payload.new as AppNotification;
          setItems((prev) => (prev.some((x) => x.id === item.id) ? prev : [item, ...prev]));
          showDesktopNotification(item);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, showDesktopNotification]);

  // --- Disari tiklaninca kapat --------------------------------------------
  useEffect(() => {
    if (!open) return;

    function onClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function requestPermission() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
  }

  async function markRead(ids: string[]) {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) => (ids.includes(item.id) ? { ...item, read_at: item.read_at ?? now } : item))
    );
    const supabase = createClient();
    await supabase.from('notifications').update({ read_at: now }).in('id', ids);
  }

  async function openNotification(item: AppNotification) {
    setOpen(false);
    await markRead([item.id]);
    if (item.request_id) router.push(`/ajans/talep/${item.request_id}`);
  }

  function toggle() {
    // Izin durumu yalnizca panel acilirken okunuyor; boylece render sirasinda
    // tarayici API'sine dokunulmuyor.
    if (!open) setPermission(readPermission());
    setOpen((v) => !v);
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        className="btn-ghost relative px-2"
        title="Bildirimler"
        aria-label={unread > 0 ? `${unread} okunmamış bildirim` : 'Bildirimler'}
        onClick={toggle}
      >
        {unread > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blossom-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-hover">
          <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Bildirimler</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-brand-700 hover:underline"
                onClick={() => markRead(items.filter((i) => !i.read_at).map((i) => i.id))}
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {permission === 'default' && (
            <div className="border-b border-surface-200 bg-soft-gradient px-4 py-3">
              <p className="text-xs text-slate-600">
                Yeni talepler bilgisayarınızda bildirim olarak çıksın mı?
              </p>
              <button type="button" className="btn-primary mt-2 text-xs" onClick={requestPermission}>
                Masaüstü bildirimlerini aç
              </button>
            </div>
          )}

          {permission === 'denied' && (
            <p className="border-b border-surface-200 bg-peach-50 px-4 py-2.5 text-xs text-peach-800">
              Masaüstü bildirimleri tarayıcı ayarlarından engellenmiş. Adres çubuğundaki kilit
              simgesinden izin verebilirsiniz.
            </p>
          )}

          <div className="max-h-[24rem] overflow-y-auto">
            {loading ? (
              <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Yükleniyor
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Henüz bildirim yok.</p>
            ) : (
              <ul className="divide-y divide-surface-200">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/60',
                        !item.read_at && 'bg-brand-50/40'
                      )}
                      onClick={() => openNotification(item)}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          item.read_at ? 'bg-surface-300' : 'bg-brand-gradient'
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800">
                          {item.title}
                        </span>
                        {item.body && (
                          <span className="block truncate text-xs text-slate-600">{item.body}</span>
                        )}
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {formatDateTime(item.created_at)}
                        </span>
                      </span>
                      {item.read_at && (
                        <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
