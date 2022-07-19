import { Fact } from "data/Facts";
import { indexes, store } from "../fact_store";

export default {
  date: "2022-07-19",
  run: async (storage: DurableObjectStorage) => {
    let fact_store = store(storage);
    let facts = [
      ...(
        await storage.list<Fact<any>>({
          prefix: "ti-",
        })
      ).values(),
    ];

    let countDuplicates: {
      [k: string]: { count: number; entries: Fact<any>[] };
    } = {};

    for (let i = 0; i < facts.length; i++) {
      let f = facts[i];

      let schema;
      schema = await fact_store.getSchema(f.attribute);

      if (schema?.cardinality === "many") continue;

      let key = `${f.attribute}-${f.entity}`;

      if (!countDuplicates[key])
        countDuplicates[key] = { count: 1, entries: [f] };
      else
        countDuplicates[key] = {
          count: countDuplicates[key].count + 1,
          entries: [...countDuplicates[key].entries, f],
        };
    }

    let keys = Object.entries(countDuplicates)
      .filter((f) => f[1].count > 1)
      .flatMap((dup) => {
        let entries = dup[1].entries.sort((a, b) =>
          a.lastUpdated > b.lastUpdated ? 1 : -1
        );
        return entries.flatMap((f, i) => {
          if (i === entries.length) return [];
          return [
            indexes.ti(f.lastUpdated, f.id),
            indexes.ea(f.entity, f.attribute, f.id),
          ];
        });
      });
    const chunkSize = 128;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);
      await storage.delete(chunk);
    }
    return;
  },
};
