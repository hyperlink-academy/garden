import { Attribute, UniqueAttributes } from "data/Attributes";
import { Fact, Schema } from "data/Facts";
import { CardinalityResult, MutationContext } from "data/mutations";
import { ulid } from "src/ulid";
import { Lock } from "src/lock";

export const indexes = {
  ea: (entity: string, attribute: string, factID: string) =>
    `ea-${entity}-${attribute}-${factID}`,
  av: (attribute: string, value: string) => `av-${attribute}-${value}`,
  factID: (factID: string) => `factID-${factID}`,
  ti: (time: string, factID: string) => `ti-${time}-${factID}`,
};

let lock = new Lock();
export const store = (storage: DurableObjectStorage) => {
  async function getSchema(attribute: string): Promise<Schema | undefined> {
    let defaultAttribute = Attribute[attribute as keyof Attribute];
    if (defaultAttribute) return defaultAttribute;

    let attributeFact = await scanIndex.ave("name", attribute);
    if (!attributeFact) return;

    let schema: Schema = {
      type:
        (await scanIndex.eav(attributeFact.entity, "type"))?.value || "string",
      unique:
        (await scanIndex.eav(attributeFact.entity, "unique"))?.value || false,
      cardinality:
        (await scanIndex.eav(attributeFact.entity, "cardinality"))?.value ||
        "one",
    };
    return schema;
  }

  const writeFactToStore = async (f: Fact<keyof Attribute>, schema: Schema) => {
    if (schema.unique) {
      let existingUniqueValue = await scanIndex.ave(
        f.attribute as keyof UniqueAttributes,
        f.value as string
      );
      if (existingUniqueValue) return { success: false };
    }
    let existingFact = await storage.get<Fact<keyof Attribute>>(
      indexes.factID(f.id)
    );
    if (existingFact) {
      storage.delete(indexes.factID(f.id));
      storage.delete(
        indexes.ea(existingFact.entity, existingFact.attribute, f.id)
      );
      storage.delete(indexes.ti(existingFact.lastUpdated, f.id));
      if (schema.unique)
        storage.delete(
          indexes.av(existingFact.attribute, existingFact.value as string)
        );
    }

    storage.put(indexes.factID(f.id), f);
    storage.put(indexes.ea(f.entity, f.attribute, f.id), f);
    storage.put(indexes.ti(f.lastUpdated, f.id), f);
    if (schema.unique) {
      storage.put(indexes.av(f.attribute, f.value as string), f);
    }
    return { success: true };
  };

  const scanIndex: MutationContext["scanIndex"] = {
    eav: async (entity, attribute) => {
      let schema = await getSchema(attribute);
      let results = [
        ...(
          await storage.list<Fact<keyof Attribute>>({
            prefix: `ea-${entity}-${attribute}`,
          })
        ).values(),
      ].filter((f) => !f.retracted);
      if (schema?.cardinality === "one")
        return results[0] as CardinalityResult<typeof attribute>;
      return results as CardinalityResult<typeof attribute>;
    },
    ave: async (attribute, value) => {
      let result = await storage.get<Fact<keyof Attribute>>(
        indexes.av(attribute, value)
      );
      return result?.retracted ? undefined : (result as Fact<typeof attribute>);
    },
  };

  let context: MutationContext = {
    scanIndex,
    postMessage: async (m) => {
      let latestMessage = await storage.get<number>("meta-latest-message");
      let index = latestMessage !== undefined ? latestMessage + 1 : 0;
      storage.put(`messages-${m.ts}-${m.id}`, {
        ...m,
        index,
      });
      await storage.put("meta-latest-message", index);
      return { success: true };
    },
    updateFact: async (id, data) => {
      let existingFact = await storage.get<Fact<keyof Attribute>>(
        indexes.factID(id)
      );
      if (!existingFact) return { success: false };

      let schema = await getSchema(existingFact.attribute);
      if (!schema)
        return {
          success: false,
        };

      return await writeFactToStore(
        {
          ...existingFact,
          ...data,
          positions: { ...existingFact.positions, ...data.positions },
          lastUpdated: Date.now().toString(),
        },
        schema
      );
    },
    retractFact: async (id) => {
      lock.withLock(async () => {
        let fact = await storage.get<Fact<keyof Attribute>>(indexes.factID(id));
        if (!fact) return;
        return await writeFactToStore(
          { ...fact, retracted: true, lastUpdated: Date.now().toString() },
          fact.schema
        );
      });
    },
    assertFact: async (f) => {
      return lock.withLock(async () => {
        let schema = await getSchema(f.attribute);
        if (!schema)
          return { success: false, error: "Invalid attribute" } as const;
        let factID = ulid();
        let lastUpdated = Date.now().toString();
        if (schema.cardinality === "one") {
          let existingFact = (await scanIndex.eav(f.entity, f.attribute)) as
            | Fact<keyof Attribute>
            | undefined;
          // We might want to preserve positions of the existing fact as well
          if (existingFact) factID = existingFact.id;
        }
        return await writeFactToStore(
          { ...f, id: factID, lastUpdated, schema },
          schema
        );
      });
    },
  };
  return { ...context, writeFactToStore, getSchema };
};
