import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'versiory_favorites';

export const getFavoriteIds = (): number[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(n => !isNaN(n)) : [];
  } catch {
    return [];
  }
};

export const isFavorite = (productId: number): boolean => getFavoriteIds().includes(productId);

export const toggleFavorite = (productId: number): boolean => {
  const ids = getFavoriteIds();
  const idx = ids.indexOf(productId);
  let nowFavorite: boolean;
  if (idx >= 0) {
    ids.splice(idx, 1);
    nowFavorite = false;
  } else {
    ids.push(productId);
    nowFavorite = true;
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent('versiory:favorites-changed', { detail: { id: productId, isFavorite: nowFavorite } }));
  return nowFavorite;
};

export const useIsFavorite = (productId: number) => {
  const [favorite, setFavorite] = useState<boolean>(() => isFavorite(productId));

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id === productId) {
        setFavorite(!!detail.isFavorite);
      }
    };
    window.addEventListener('versiory:favorites-changed', handler);
    // sync on mount / storage changes from other tabs
    const storageHandler = () => setFavorite(isFavorite(productId));
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('versiory:favorites-changed', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [productId]);

  const toggle = () => {
    const now = toggleFavorite(productId);
    setFavorite(now);
    return now;
  };

  return [favorite, toggle] as const;
};
