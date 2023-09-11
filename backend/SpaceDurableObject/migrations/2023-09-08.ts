import { ulid } from "src/ulid";
import { store } from "../fact_store";

export default {
  date: "2023-09-08",
  run: async function(storage: DurableObjectStorage) {
    let fact_store = store(storage, { id: "" });
    let members = await fact_store.scanIndex.aev("member/name");
    for (let member of members) {
      let cardsInMemberSpace = await fact_store.scanIndex.eav(
        member.entity,
        "desktop/contains"
      );
      if (cardsInMemberSpace.length === 0) continue;
      let newRoom = ulid();
      await Promise.all([
        fact_store.assertFact({
          entity: newRoom,
          attribute: "room/type",
          value: "canvas",
          positions: {},
        }),

        fact_store.assertFact({
          entity: newRoom,
          attribute: "room/name",
          value: member.value,
          positions: {},
        }),
      ]);
      for (let card of cardsInMemberSpace) {
        let position = await fact_store.scanIndex.eav(
          card.id,
          "card/position-in"
        );
        if (!position) continue;
        let newFactID = ulid();
        await fact_store.assertFact({
          entity: newRoom,
          factID: newFactID,
          attribute: "desktop/contains",
          value: card.value,
          positions: {},
        });
        await fact_store.assertFact({
          entity: newFactID,
          attribute: "card/position-in",
          value: position.value,
          positions: {},
        });
      }
    }
  },
};
