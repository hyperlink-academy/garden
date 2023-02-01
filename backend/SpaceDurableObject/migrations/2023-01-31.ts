import { store } from "../fact_store";

export default {
  date: "2023-01-31",
  run: async function (storage: DurableObjectStorage) {
    let fact_store = store(storage, { id: "" });
    // We're casting because we deleted this attribute
    // We just want an arbitrary string attribute
    let images = await fact_store.scanIndex.aev(
      "space/door/image" as "space/description"
    );

    for (let image of images) {
      await fact_store.updateFact(image.id, {
        attribute: "space/door/uploaded-image",
        value: {
          type: "file",
          filetype: "external_image",
          url: image.value,
        },
      });
    }
  },
};
