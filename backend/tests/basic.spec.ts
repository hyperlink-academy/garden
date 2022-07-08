import { beforeAll, test, expect } from "@jest/globals";
import { store } from "backend/SpaceDurableObject/fact_store";
import { Fact } from "data/Facts";
import { ulid } from "src/ulid";
const { SPACES } = getMiniflareBindings();
const id = SPACES.newUniqueId();
const stub = SPACES.get(id);

// Note this is beforeAll, not beforeEach, yet each test still has isolated storage.
// See https://v2.miniflare.dev/jest.html#isolated-storage for more details.
//
beforeAll(async () => {
  // Gotta initialize the DO
  await stub.fetch("http://localhost/poke");
});

test("single cardinality asserts should only create one fact even with multiple competing asserts", async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
  let fact_store = store(storage);

  let latestFact = [
    ...(
      await storage.list<Fact<any>>({ prefix: "ti-", limit: 1, reverse: true })
    ).values(),
  ][0];
  expect(latestFact).toBeTruthy();

  let entity = ulid();
  await Promise.all(
    ["value 1", "value 2", "value 3"].map((value) =>
      fact_store.assertFact({
        entity,
        attribute: "card/content",
        value,
        positions: {},
      })
    )
  );
  let newFacts = [
    ...(await storage.list<Fact<any>>({
      prefix: "ti-",
      startAfter: `ti-${latestFact.lastUpdated}-z`,
    })),
  ];
  expect(newFacts.length).toEqual(1);
});
