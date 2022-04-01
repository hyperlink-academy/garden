import { Attribute } from "data/Attributes";
import { Fact, Schema } from "data/Facts";
import { CardinalityResult, MutationContext } from "data/mutations";
import { ulid } from "src/ulid";

export const indexes = {
  ea: (entity: string, attribute: string, factID: string) =>
    `ea-${entity}-${attribute}-${factID}`,
  av: (attribute: string, value: string) => `av-${attribute}-${value}`,
  factID: (factID: string) => `factID-${factID}`,
  ti: (time: string, factID: string) => `ti-${time}-${factID}`,
};

export const store = (storage: DurableObjectStorage) => {
  async function getSchema(attribute: string): Promise<Schema | undefined> {
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
    storage.put(indexes.ti(f.lastUpdated, f.id), { ...f, meta: { schema } });
    if (schema.unique) {
      storage.put(indexes.av(f.attribute, f.value as string), f);
    }
  };

  const scanIndex: MutationContext["scanIndex"] = {
    eav: async (entity, attribute) => {
      let schema = Attribute[attribute];
      let results = [
        ...(
          await storage.list<Fact<keyof Attribute>>({
            prefix: `ea-${entity}-${attribute}`,
          })
        ).values(),
      ];
      if (schema?.cardinality === "one")
        return results[0] as CardinalityResult<typeof attribute>;
      return results as CardinalityResult<typeof attribute>;
    },
    ave: async (attribute, value) => {
      let results = [
        ...(
          await storage.list({
            prefix: `av-${attribute}-${value}`,
          })
        ).values(),
      ];
      return results[0] as Fact<typeof attribute>;
    },
  };
  let context: MutationContext = {
    scanIndex,
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

      writeFactToStore(
        {
          ...existingFact,
          ...data,
          positions: { ...existingFact.positions, ...data.positions },
          lastUpdated: Date.now().toString(),
        },
        schema
      );
      return { success: true };
    },
    retractFact: async (id) => {
      let fact = await storage.get<Fact<keyof Attribute>>(indexes.factID(id));
      if (!fact) return;
      await writeFactToStore(
        { ...fact, retracted: true, lastUpdated: Date.now().toString() },
        fact.schema
      );
    },
    assertFact: async (f) => {
      let schema = await getSchema(f.attribute);
      if (!schema)
        return { success: false, error: "Invalid attribute" } as const;
      let newID = ulid();
      let lastUpdated = Date.now().toString();
      if (schema.cardinality === "one") {
        let existingFact = (await scanIndex.eav(f.entity, f.attribute)) as
          | Fact<keyof Attribute>
          | undefined;
        if (existingFact) newID = existingFact.id;
      }
      writeFactToStore({ ...f, id: newID, lastUpdated, schema }, schema);
      return { success: true };
    },
  };
  return { ...context, writeFactToStore };
};
