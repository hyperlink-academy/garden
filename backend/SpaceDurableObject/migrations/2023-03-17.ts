import { store } from "../fact_store";

export default {
  date: "2023-03-17",
  run: async function(storage: DurableObjectStorage) {
    // This migration changes all prompt rooms to just normal rooms with type
    let fact_store = store(storage, { id: "" });
    let spaceName = (await fact_store.scanIndex.aev("this/name"))[0];

    if (!spaceName) return
    let display_name = await fact_store.scanIndex.eav(spaceName.entity, "space/display_name");

    if (!display_name) {
      await fact_store.assertFact({
        entity: spaceName.entity,
        attribute: "space/display_name",
        value: spaceName.value,
        positions: {}
      })
    }
  },
};
