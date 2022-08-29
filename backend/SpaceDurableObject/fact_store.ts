import { Attribute, UniqueAttributes } from "data/Attributes";
import { Fact, ReferenceType, Schema } from "data/Facts";
import { CardinalityResult, MutationContext } from "data/mutations";
import { ulid } from "src/ulid";
import { Lock } from "src/lock";

export const indexes = {
  ea: (entity: string, attribute: string, factID: string) =>
    `ea-${entity}-${attribute}-${factID}`,
  ae: (attribute: string, entity: string, factID: string) =>
    `ae-${attribute}-${entity}-${factID}`,
  av: (attribute: string, value: string) => `av-${attribute}-${value}`,
  va: (
    v: { type: "reference"; value: string },
    attribute: string,
    factID: string
  ) => `va-${v.value}-${attribute}-${factID}`,
  factID: (factID: string) => `factID-${factID}`,
  ti: (time: string, factID: string) => `ti-${time}-${factID}`,
};

let lock = new Lock();
export interface BasicStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  list<T = unknown>(options?: { prefix: string }): Promise<Map<string, T>>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string, options?: DurableObjectPutOptions): Promise<boolean>;
}
export const store = (storage: BasicStorage, ctx: { id: string }) => {
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
      if (existingUniqueValue && existingUniqueValue.id !== f.id)
        return { success: false };
    }
    let existingFact = await storage.get<Fact<keyof Attribute>>(
      indexes.factID(f.id)
    );
    if (existingFact) {
      storage.delete(indexes.factID(f.id));
      storage.delete(
        indexes.ae(existingFact.attribute, existingFact.entity, existingFact.id)
      );
      storage.delete(
        indexes.ea(existingFact.entity, existingFact.attribute, f.id)
      );
      storage.delete(indexes.ti(existingFact.lastUpdated, f.id));
      if (schema.unique)
        storage.delete(
          indexes.av(existingFact.attribute, existingFact.value as string)
        );

      if (schema.type === "reference")
        storage.delete(
          indexes.va(
            existingFact.value as ReferenceType,
            existingFact.attribute,
            existingFact.id
          )
        );
    }

    storage.put(indexes.factID(f.id), f);
    storage.put(indexes.ea(f.entity, f.attribute, f.id), f);
    storage.put(indexes.ae(f.attribute, f.entity, f.id), f);
    storage.put(indexes.ti(f.lastUpdated, f.id), f);
    if (schema.unique && f.value) {
      storage.put(indexes.av(f.attribute, f.value as string), f);
    }
    if (schema.type === "reference") {
      storage.put(indexes.va(f.value as ReferenceType, f.attribute, f.id), f);
    }
    return { success: true };
  };

  const scanIndex: MutationContext["scanIndex"] = {
    aev: async (attribute, entity) => {
      let results = [
        ...(
          await storage.list<Fact<typeof attribute>>({
            prefix: `ae-${attribute}-${entity || ""}`,
          })
        ).values(),
      ].filter((f) => !f.retracted);
      return results;
    },
    vae: async (entity, attribute) => {
      let results = [
        ...(
          await storage.list<Fact<Exclude<typeof attribute, undefined>>>({
            prefix: `va-${entity}-${attribute || ""}`,
          })
        ).values(),
      ].filter((f) => !f.retracted);
      return results;
    },
    eav: async (entity, attribute) => {
      let results = [
        ...(
          await storage.list<Fact<keyof Attribute>>({
            prefix: `ea-${entity}-${attribute || ""}`,
          })
        ).values(),
      ].filter((f) => !f.retracted);
      if (!attribute) return results as CardinalityResult<typeof attribute>;

      let schema = await getSchema(attribute);
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
    postMessage: async (m, opts) => {
      let latestMessage = await storage.get<number>("meta-latest-message");
      let index = latestMessage !== undefined ? latestMessage + 1 : 0;
      storage.put(`messages-${m.ts}-${m.id}`, {
        ...m,
        index,
      });

      // CALL BOTS
      // Get bots mentioned
      // Lookup bot URL
      // generate API key
      // Send request to bot including: api key, message data, and SPACE_ID
      if (!opts?.ignoreBots) {
        let botsMentions = m.content.match(/\@\w*/g);
        if (botsMentions && botsMentions[0]) {
          let bot = botsMentions[0].slice(1);
          let botName = await scanIndex.ave("bot/name", bot);
          if (botName) {
            let botURL = await scanIndex.eav(botName.entity, "bot/url");
            if (botURL) {
              try {
                fetch(botURL.value, {
                  method: "POST",
                  headers: {
                    "Content-type": "application/json",
                  },
                  body: JSON.stringify({
                    botEntity: botName.entity,
                    message: m,
                    spaceID: ctx.id,
                  }),
                });
              } catch (e) {}
            }
          }
        }
      }

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
      return lock.withLock(async () => {
        let fact = await storage.get<Fact<keyof Attribute>>(indexes.factID(id));
        if (!fact) return;
        await writeFactToStore(
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
        let result = await writeFactToStore(
          { ...f, id: factID, lastUpdated, schema },
          schema
        );
        if (result.success) return { success: true, factID };
        return { success: false };
      });
    },
  };
  return {
    ...context,
    writeFactToStore,
    getSchema,
  };
};
