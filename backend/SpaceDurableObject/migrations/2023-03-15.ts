import { store } from "../fact_store";

export default {
  date: "2023-03-15",
  run: async function (storage: DurableObjectStorage) {
    // This migration changes all prompt rooms to just normal rooms with type
    let fact_store = store(storage, { id: "" });
    let spaceNames = await fact_store.scanIndex.aev("space/name");
    for (let name of spaceNames) {
      await fact_store.assertFact({
        entity: name.entity,
        attribute: "space/display_name",
        value: name.value,
        positions: {},
      });
    }
  },
};
