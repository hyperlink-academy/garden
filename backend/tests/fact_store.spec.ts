import { beforeAll, test, expect } from "@jest/globals";
import { store } from "backend/SpaceDurableObject/fact_store";
import { Fact } from "data/Facts";
import { ulid } from "src/ulid";
const { SPACES } = getMiniflareBindings();
const id = SPACES.newUniqueId();
const stub = SPACES.get(id);

beforeAll(async () => {
  // Gotta initialize the DO
  await stub.fetch("http://localhost/poke");
});

test("retracting a fact marks it as retracted", async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
  let fact_store = store(storage, { id: "" });
  let entity = ulid();
  await fact_store.assertFact({
    entity,
    attribute: "card/title",
    value: "Title",
    positions: {},
  });
  let fact = await fact_store.scanIndex.eav(entity, "card/title");
  expect(fact?.value).toBe("Title");
  if (!fact) throw new Error();
  await fact_store.retractFact(fact.id);
  let retractedFact = await fact_store.scanIndex.eav(entity, "card/title");
  expect(retractedFact).toBeFalsy();
});

test("single cardinality asserts should only create one fact even with multiple competing asserts", async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
  let fact_store = store(storage, { id: "" });

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
      startAfter: `ti-`,
    })),
  ];
  expect(newFacts.length).toEqual(1);
});

test("you can't assert a fact with an unknown attribute", async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
  let fact_store = store(storage, { id: "" });

  let entity = ulid();
  let result = await fact_store.assertFact({
    entity,
    attribute: "unknown attr" as "card/content",
    value: "nada",
    positions: {},
  });
  expect(result.success).toBe(false);
  let newFacts = [
    ...(await storage.list<Fact<any>>({
      prefix: "ti-",
      startAfter: `ti-`,
    })),
  ];
  expect(newFacts.length).toEqual(0);
});

test("you can assert a fact if you create the attribute first", async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
  let fact_store = store(storage, { id: "" });
  let newAttributeName = "a-new-attribute" as "arbitrarySectionStringType";

  let attributeEntity = ulid();
  await Promise.all([
    fact_store.assertFact({
      entity: attributeEntity,
      attribute: "name",
      value: newAttributeName,
      positions: {},
    }),
    fact_store.assertFact({
      entity: attributeEntity,
      attribute: "type",
      value: "string",
      positions: {},
    }),
  ]);

  let result = await fact_store.assertFact({
    entity: ulid(),
    attribute: newAttributeName,
    value: "a value",
    positions: {},
  });
  expect(result.success).toBe(true);
});

test("You can't create multiple facts with the same value of a unique attribute", async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
  let fact_store = store(storage, { id: "" });
  let uniqueValue = "a unique value";

  let originalEntity = ulid();
  await fact_store.assertFact({
    entity: originalEntity,
    attribute: "card/title",
    value: uniqueValue,
    positions: {},
  });

  expect(
    (await fact_store.scanIndex.ave("card/title", uniqueValue))?.entity
  ).toBe(originalEntity);

  let result = await fact_store.assertFact({
    entity: ulid(),
    attribute: "card/title",
    value: uniqueValue,
    positions: {},
  });
  expect(result.success).toBe(false);
  expect(
    (await fact_store.scanIndex.ave("card/title", uniqueValue))?.entity
  ).toBe(originalEntity);
});

test("retracting an ephemeral fact fully deletes it", async () => {
  const storage = await getMiniflareDurableObjectStorage(id);
  let fact_store = store(storage, { id: "" });

  let entity = ulid();
  let clientID = "01234";
  await fact_store.assertEmphemeralFact(clientID, {
    entity,
    attribute: "presence/client-id",
    value: "client-id",
    positions: {},
  });
  let fact = await fact_store.scanIndex.eav(entity, "presence/client-id");
  expect(fact).toBeTruthy();
  let facts = await storage.list<Fact<any>>({
    prefix: "ephemeral-",
  });
  expect([...facts.entries()].length).toBe(1);
  await fact_store.retractEphemeralFact(clientID, fact?.id as string);

  fact = await fact_store.scanIndex.eav(entity, "presence/client-id");
  expect(fact).toBeFalsy();
  facts = await storage.list<Fact<any>>({
    prefix: "ephemeral-",
  });
  expect([...facts.entries()].length).toBe(0);
});
