import { BasicStorage } from "./fact_store";

type CacheMap = Map<string, { value: any | undefined; dirty: boolean }>;

/**
 * Implements Replicache's WriteTransaction interface in terms of a Postgres
 * transaction.
 */
export class CachedStorage implements BasicStorage {
  private _executor: DurableObjectStorage;
  private _cache: CacheMap = new Map();

  constructor(storage: DurableObjectStorage) {
    this._executor = storage;
  }

  async put<T>(key: string, value: T): Promise<void> {
    this._cache.set(key, { value, dirty: true });
  }
  async delete(key: string): Promise<boolean> {
    this._cache.set(key, { value: undefined, dirty: true });
    return true;
  }
  async get<T>(key: string): Promise<T | undefined> {
    const entry = this._cache.get(key);
    if (entry) {
      return entry.value as T;
    }
    const value = await this._executor.get(key);
    this._cache.set(key, { value, dirty: false });
    return value as T;
  }

  private _list_cache: Map<
    string,
    { value: Map<string, any>; dirty: boolean }
  > = new Map();

  async list<T>(options: { prefix: string }) {
    const { _executor: executor, _cache: cache } = this;

    let list: Map<string, T>;

    let list_in_cache = this._list_cache.get(options.prefix);
    if (!list_in_cache) {
      list = await getEntries<T>(executor, options.prefix);
      this._list_cache.set(options.prefix, { value: list, dirty: false });
    } else {
      list = list_in_cache.value;
    }

    const pending = getCacheEntries<T>(cache, options.prefix);
    for (let cacheEntry of pending) {
      if (cacheEntry[1] !== undefined) list.set(cacheEntry[0], cacheEntry[1]);
    }

    return list;
  }

  async flush(): Promise<void> {
    await Promise.all(
      [...this._cache.entries()]
        .filter(([, { dirty }]) => dirty)
        .map(([k, { value }]) => {
          if (value === undefined) {
            return this._executor.delete(k);
          } else {
            return this._executor.put(k, value);
          }
        })
    );
  }
}

function getCacheEntries<T>(
  cache: CacheMap,
  prefix: string
): Iterable<readonly [string, T | undefined]> {
  const entries = [];
  for (const [key, { value, dirty }] of cache) {
    if (dirty && key.startsWith(prefix)) {
      entries.push([key, value as T] as const);
    }
  }
  entries.sort((a, b) => stringCompare(a[0], b[0]));
  return entries;
}

function stringCompare(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

async function getEntries<T>(executor: DurableObjectStorage, prefix: string) {
  const result = await executor.list<T>({ prefix });
  return result;
}
