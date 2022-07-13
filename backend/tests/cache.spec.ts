import { beforeAll, test, expect } from "@jest/globals";
const { SPACES } = getMiniflareBindings();
import { CachedStorage } from "backend/SpaceDurableObject/storage_cache";
import { ulid } from "src/ulid";
const id = SPACES.newUniqueId();

const stub = SPACES.get(id);

beforeAll(async () => {
  // Gotta initialize the DO
  await stub.fetch("http://localhost/poke");
});

test("Deletes followed by puts result in puts", async () => {
  let storage = await getMiniflareDurableObjectStorage(id);

  let keys = [ulid(), ulid(), ulid(), ulid()];

  let cache = new CachedStorage(storage);

  if (true) {
    keys.forEach((k) => {
      cache.delete(k);
    });
  }
  keys.forEach((k) => {
    cache.put(k, k);
  });
  await new Promise(process.nextTick);
  await cache.flush();
  let values = await Promise.all(keys.map((k) => storage.get<string>(k)));
  values.forEach((v, index) => {
    expect(v).toEqual(keys[index]);
  });
});

test("lists can observe cached puts", async () => {
  let storage = await getMiniflareDurableObjectStorage(id);

  storage.put("key-1", "value-1");
  let cache = new CachedStorage(storage);
  cache.put("key-2", "value-2");
  cache.put("key-3", "value-3");
  let list = await cache.list<string>({ prefix: "key-" });

  expect(list.get("key-1")).toEqual("value-1");
  expect(list.get("key-2")).toEqual("value-2");
  expect(list.get("key-3")).toEqual("value-3");
});

test("cached listss are correctly sorted", async () => {
  let storage = await getMiniflareDurableObjectStorage(id);

  storage.put("key-1", "value-1");
  let cache = new CachedStorage(storage);
  cache.put("key-3", "value-3");
  cache.put("key-2", "value-2");
  cache.put("key-4", "value-4");

  let list = await cache.list<string>({ prefix: "key-" });
  let keys = [...list.keys()];
  expect(keys).toEqual(["key-1", "key-2", "key-3", "key-4"]);
});

test("list calls cache", async () => {
  let numberOfTimesCalled = 0;
  let storage = new Proxy(await getMiniflareDurableObjectStorage(id), {
    get(target, prop: keyof DurableObjectStorage, receiver) {
      if (prop === "list") {
        numberOfTimesCalled++;
      }
      const value = target[prop];
      if (value instanceof Function)
        return function (this: any, ...args: any[]) {
          return (value as Function).apply(
            this === receiver ? target : this,
            args
          );
        };
      return value;
    },
  });

  storage.put("key-1", "value-1");
  let cache = new CachedStorage(storage);

  await cache.list({ prefix: "key" });
  expect(numberOfTimesCalled).toBe(1);

  await cache.list({ prefix: "key" });
  expect(numberOfTimesCalled).toBe(1);
});

test("deleting a previously put key results in a delete", async () => {
  let storage = await getMiniflareDurableObjectStorage(id);

  storage.put("key-1", "value-1");
  let cache = new CachedStorage(storage);
  cache.delete("key-1");
  let cachedValue = await cache.get<string>("key-1");
  expect(cachedValue).toBeUndefined();
  await cache.flush();
  let storedValue = await cache.get("key-1");
  expect(storedValue).toBeUndefined();
});

test("cache can observe previous puts", async () => {
  let storage = await getMiniflareDurableObjectStorage(id);

  storage.put("key-1", "value-1");
  let cache = new CachedStorage(storage);
  let cachedValue = await cache.get<string>("key-1");
  expect(cachedValue).toEqual("value-1");
});
