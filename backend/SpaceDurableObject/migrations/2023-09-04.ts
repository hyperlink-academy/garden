import { store } from "../fact_store";
import { memberColors } from "src/colors";
import { getMemberColor } from "../routes/join";

export default {
  date: "2023-09-04",
  run: async function (storage: DurableObjectStorage) {
    let fact_store = store(storage, { id: "" });
    let members = await fact_store.scanIndex.aev("space/member");
    for (let member of members) {
      //@ts-ignore
      let color = await getMemberColor(fact_store);
      await fact_store.assertFact({
        entity: member.entity,
        attribute: "member/color",
        value: color,
        positions: {},
      });
    }
  },
};
