'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * localStorage'daki bir degeri React state'i gibi kullanmayi saglar.
 * Ayar tarayiciya ozeldir; kullanici veya hesap bazinda saklanmaz.
 *
 * useSyncExternalStore kullaniliyor: sunucuda varsayilan deger doner,
 * istemcide hidrasyondan sonra gercek deger okunur; boylece hidrasyon
 * uyusmazligi olusmaz.
 */

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  // Diger sekmelerdeki degisiklikler de yansisin.
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

export function useStoredValue(key: string, fallback: string) {
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      // Gizli pencerede localStorage kapali olabilir.
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Yazilamiyorsa ayar kalici olmaz; arayuz yine de guncellensin.
      }
      emit();
    },
    [key]
  );

  return [value, setValue] as const;
}
