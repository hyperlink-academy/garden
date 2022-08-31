import { store } from "../fact_store";

export default {
  date: "2022-08-30-2",
  run: async (storage: DurableObjectStorage) => {
    let fact_store = store(storage, { id: "" });
    let home = await fact_store.scanIndex.aev("home");

    if (!home[0]) return;
    let decks = await fact_store.scanIndex.eav(home[0].entity, "deck/contains");

    for (let i = 0; i < decks.length; i++) {
      await fact_store.assertFact({
        entity: decks[i].id,
        attribute: "card/position-in",
        value: {
          type: "position",
          rotation: 0,
          x: 10,
          y: i * 300,
          size: "big",
        },
        positions: {},
      });
    }
  },
};
