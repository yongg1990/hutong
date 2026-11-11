import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from 'vue';

type OptionCache = Map<string, Promise<unknown>>;
const pageOptionsKey: InjectionKey<ShallowRef<OptionCache>> = Symbol('pageOptions');

export function providePageOptions() {
  const cache = shallowRef<OptionCache>(new Map());
  provide(pageOptionsKey, cache);
  return () => { cache.value = new Map(); };
}

export function usePageOptions() {
  const cache = inject(pageOptionsKey, shallowRef<OptionCache>(new Map()));
  return function loadOptions<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const entries = cache.value;
    let pending = entries.get(key) as Promise<T> | undefined;
    if (!pending) {
      pending = Promise.resolve().then(loader).catch(error => {
        entries.delete(key);
        throw error;
      });
      entries.set(key, pending);
    }
    return pending;
  };
}
