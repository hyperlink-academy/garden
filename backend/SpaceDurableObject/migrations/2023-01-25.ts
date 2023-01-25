import { store } from "../fact_store";

export default {
  date: "2023-01-25",
  run: async function (storage: DurableObjectStorage) {
    let fact_store = store(storage, { id: "" });

    let home = await fact_store.scanIndex.aev("home");
    let rooms = await fact_store.scanIndex.aev("room/name");

    for (let room of [...home, ...rooms]) {
      let cards = await fact_store.scanIndex.eav(room.entity, "deck/contains");
      for (let card of cards) {
        await fact_store.updateFact(card.id, { attribute: "desktop/contains" });
      }
    }
  },
};
