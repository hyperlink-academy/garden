import { store } from "../fact_store";

export default {
  date: "2023-03-22",
  run: async function(storage: DurableObjectStorage) {
    let fact_store = store(storage, { id: "" });
    let spaceName = (await fact_store.scanIndex.aev("this/name"))[0];
    let spaces = (await fact_store.scanIndex.aev("space/studio")).filter(
      (f) => f.value === spaceName?.value
    );
    for (let space of spaces) {
      let name = await fact_store.scanIndex.eav(space.entity, "space/name");
      if (name)
        await fact_store.assertFact({
          entity: space.entity,
          attribute: "space/local-unique-name",
          value: name.value,
          positions: {},
        });
    }
  },
};
