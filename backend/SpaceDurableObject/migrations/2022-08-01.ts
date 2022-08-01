import { Fact } from "data/Facts";
import { indexes } from "../fact_store";

export default {
  date: "2022-08-01",
  run: async (storage: DurableObjectStorage) => {
    let facts = [
      ...(
        await storage.list<Fact<any>>({
          prefix: "ti-",
        })
      ).values(),
    ];

    const chunkSize = 128;
    for (let i = 0; i < facts.length; i += chunkSize) {
      const chunk = facts.slice(i, i + chunkSize);
      await storage.put(
        Object.fromEntries(
          chunk.map((f) => [indexes.ae(f.attribute, f.entity, f.id), f])
        )
      );
    }
  },
};
