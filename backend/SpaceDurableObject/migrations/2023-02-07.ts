import { store } from "../fact_store";

export default {
  date: "2023-02-06",
  run: async function (storage: DurableObjectStorage) {
    let fact_store = store(storage, { id: "" });
    let home = (await fact_store.scanIndex.aev("home"))[0];
    if (!home) return;

    await fact_store.assertFact({
      entity: home.entity,
      attribute: "room/name",
      value: "Home",
      positions: {},
    });
  },
};
