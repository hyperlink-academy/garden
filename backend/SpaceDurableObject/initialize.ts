import { ulid } from "src/ulid";
import { BaseAttributes, DefaultAttributes, Attribute } from "data/Attributes";
import { Schema, Fact } from "data/Facts";
import { store } from "./fact_store";

export async function init(tx: DurableObjectStorage) {
  let lastUpdated = Date.now().toString();
  let db = store(tx);
  await Promise.all(
    Object.keys(BaseAttributes).map(async (attributeName) => {
      let entity = ulid();
      const write = (
        attribute: keyof Attribute,
        value: any,
        schema: Schema
      ) => {
        let fact: Fact<keyof Attribute> = {
          id: ulid(),
          lastUpdated,
          schema,
          positions: {},
          entity,
          attribute,
          value: value,
        };
        return db.writeFactToStore(fact, schema);
      };
      let attribute =
        BaseAttributes[attributeName as keyof typeof BaseAttributes];
      await Promise.all([
        write("name", attributeName, BaseAttributes.name),
        write("unique", attribute.unique, BaseAttributes.unique),
        write("cardinality", attribute.cardinality, BaseAttributes.cardinality),
        write("type", attribute.type, BaseAttributes.type),
        attribute.type === "union"
          ? Promise.all(
              attribute["union/value"].map((v) =>
                write("union/value", v, BaseAttributes["union/value"])
              )
            )
          : null,
      ]);
    })
  );
  await Promise.all(
    Object.keys(DefaultAttributes).map(async (s) => {
      let section = DefaultAttributes[s as keyof typeof DefaultAttributes];
      let entity = ulid();
      await Promise.all([
        db.assertFact({
          entity,
          positions: {},
          attribute: "type",
          value: section.type,
        }),

        db.assertFact({
          entity,
          positions: {},
          attribute: "unique",
          value: section.unique,
        }),

        db.assertFact({
          entity,
          positions: {},
          attribute: "name",
          value: s,
        }),

        db.assertFact({
          entity,
          attribute: "cardinality",
          value: section.cardinality,
          positions: {},
        }),
      ]);
    })
  );
}
