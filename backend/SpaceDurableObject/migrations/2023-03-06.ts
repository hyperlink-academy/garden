import { store } from "../fact_store";

let defaultReactions = [
  "😊",
  "😔",
  "❤️",
  "🎉",
  "🔥",
  "👀",
  "💀",
  "📌",
  "✅",
  "👍",
  "👎",
  "!!",
  "?",
];

export default {
  date: "2023-03-06",
  run: async function (storage: DurableObjectStorage) {
    // This migration changes all prompt rooms to just normal rooms with type
    let fact_store = store(storage, { id: "" });
    let spaceEntity = (await fact_store.scanIndex.aev("this/name"))[0];
    if (!spaceEntity) return;
    for (let reaction of defaultReactions) {
      await fact_store.assertFact({
        entity: spaceEntity?.entity,
        attribute: "space/reaction",
        value: reaction,
        positions: {},
      });
    }
  },
};
