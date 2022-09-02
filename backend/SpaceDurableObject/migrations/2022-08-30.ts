import { store } from "../fact_store";

export default {
  date: "2022-08-30-4",
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
          y: i * 100,
          size: "big",
        },
        positions: {},
      });
    }
    await fact_store.assertFact({
      attribute: "canvas/height",
      entity: home[0].entity,
      positions: {},
      value: decks.length * 100 + 100,
    });
  },
};
