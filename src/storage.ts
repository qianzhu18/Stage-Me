import { useEffect, useState } from 'react';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export function readStorage<T>(key: string, fallback: T): T {
  const storage = getStorage();
  if (!storage) {
    return fallback;
  }

  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => readStorage(key, initialValue));

  useEffect(() => {
    writeStorage(key, state);
  }, [key, state]);

  return [state, setState] as const;
}
