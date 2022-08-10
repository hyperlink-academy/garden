import { flag, ref } from "data/Facts";
import { ulid } from "src/ulid";
import { store } from "../fact_store";

export default {
  date: "2022-08-10",
  run: async (storage: DurableObjectStorage) => {
    let fact_store = store(storage, { id: "" });
    let decks = await fact_store.scanIndex.aev("deck");
    let newHomeEntity = ulid();
    if (decks.length === 0) return;
    await fact_store.assertFact({
      entity: newHomeEntity,
      attribute: "home",
      value: flag(),
      positions: {},
    });
    for (let i = 0; i < decks.length; i++) {
      await fact_store.assertFact({
        entity: newHomeEntity,
        attribute: "deck/contains",
        value: ref(decks[i].entity),
        positions: {
          eav: "a" + i,
        },
      });
    }
  },
};
