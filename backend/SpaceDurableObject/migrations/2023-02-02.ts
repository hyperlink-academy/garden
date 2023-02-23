import { store } from "../fact_store";

export default {
  date: "2023-02-02",
  run: async function (storage: DurableObjectStorage) {
    let fact_store = store(storage, { id: "" });
    // We're casting because we deleted this attribute
    // We just want an arbitrary string attribute
    let rooms = await fact_store.scanIndex.aev("room/name");

    let promptRoom = rooms.find((r) => r.value === "prompts");
    if (promptRoom) {
      await fact_store.updateFact(promptRoom.id, {
        attribute: "promptroom/name",
        value: "Prompt Pool",
      });
    }
  },
};
