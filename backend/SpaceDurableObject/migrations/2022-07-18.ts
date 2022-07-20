import { Fact } from "data/Facts";
import { indexes } from "../fact_store";

export default {
  date: "2022-07-18",
  run: async (storage: DurableObjectStorage) => {
    let countDuplicates = [
      ...(
        await storage.list<Fact<any>>({
          prefix: "ti-",
        })
      ).values(),
    ].reduce((dups, f) => {
      if (!dups[f.id]) dups[f.id] = { count: 1, entries: [f] };
      else
        dups[f.id] = {
          count: dups[f.id].count + 1,
          entries: [...dups[f.id].entries, f],
        };
      return dups;
    }, {} as { [k: string]: { count: number; entries: Fact<any>[] } });

    let idDeleteKeys = Object.entries(countDuplicates)
      .filter((f) => f[1].count > 1)
      .flatMap((dup) => {
        let entries = dup[1].entries.sort((a, b) =>
          a.lastUpdated > b.lastUpdated ? 1 : -1
        );
        return entries.flatMap((e, index) => {
          if (index === entries.length - 1) return [];
          return [indexes.ti(e.lastUpdated, e.id)];
        });
      });

    const chunkSize = 128;
    for (let i = 0; i < idDeleteKeys.length; i += chunkSize) {
      const chunk = idDeleteKeys.slice(i, i + chunkSize);
      await storage.delete(chunk);
    }
  },
};
