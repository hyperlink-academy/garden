import { store } from "../fact_store";

export default {
  date: "2023-02-14",
  run: async function (storage: DurableObjectStorage) {
    // This migration changes all prompt rooms to just normal rooms with type
    // collection.
    let fact_store = store(storage, { id: "" });
    //@ts-ignore
    let promptrooms = await fact_store.scanIndex.aev("promptroom/name");
    let desktopRooms = await fact_store.scanIndex.aev("room/name");
    for (let room of promptrooms) {
      await fact_store.updateFact(room.id, {
        attribute: "room/name",
      });
      await fact_store.assertFact({
        entity: room.entity,
        attribute: "room/type",
        value: "collection",
        positions: {},
      });
    }
    for (let room of desktopRooms) {
      await fact_store.assertFact({
        entity: room.entity,
        attribute: "room/type",
        value: "canvas",
        positions: {},
      });
    }
  },
};
