import { store } from "../fact_store";

export default {
  date: "2023-03-18",
  run: async function(storage: DurableObjectStorage, env: { id: string }) {
    // This migration changes all prompt rooms to just normal rooms with type
    let fact_store = store(storage, { id: "" });
    let spaceName = (await fact_store.scanIndex.aev("this/name"))[0];

    if (!spaceName) return
    let spaceID = await fact_store.scanIndex.eav(spaceName.entity, "space/id");

    if (!spaceID) {
      await fact_store.assertFact({
        entity: spaceName.entity,
        attribute: "space/id",
        value: env.id,
        positions: {}
      })
    }
  },
};
