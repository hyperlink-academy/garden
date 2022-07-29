import { ReferenceAttributes } from "data/Attributes";
import { Fact } from "data/Facts";
import { indexes, store } from "../fact_store";

export default {
  date: "2022-07-20",
  run: async (storage: DurableObjectStorage) => {
    let fact_store = store(storage, { id: "" });
    let facts = [
      ...(
        await storage.list<Fact<any>>({
          prefix: "ti-",
        })
      ).values(),
    ];

    for (let i = 0; i < facts.length; i++) {
      let f = facts[i];
      let schema;
      schema = await fact_store.getSchema(f.attribute);
      if (schema?.type === "reference") {
        let fact: Fact<keyof ReferenceAttributes> = f;
        storage.put(indexes.va(fact.value, fact.attribute, f.id), fact);
      }
    }
    return;
  },
};
