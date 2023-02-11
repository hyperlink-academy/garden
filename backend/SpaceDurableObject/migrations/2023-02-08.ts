import { store } from "../fact_store";

export default {
  date: "2023-02-08",
  run: async function (storage: DurableObjectStorage) {
    // We need to create a space/studio entry inside the space, so we can use
    // it for auth
    let fact_store = store(storage, { id: "" });
    let spaceEntity = (await fact_store.scanIndex.aev("this/name"))[0];
    if (!spaceEntity) return;

    let memberID = await storage.get<string>("meta-creator");
    if (!memberID) return;
    let memberEntity = await fact_store.scanIndex.ave("space/member", memberID);
    if (!memberEntity) return;
    let memberName = await fact_store.scanIndex.eav(
      memberEntity.entity,
      "member/name"
    );
    if (!memberName) return;

    await fact_store.assertFact({
      entity: spaceEntity?.entity,
      attribute: "space/studio",
      value: memberName.value,
      positions: {},
    });
  },
};
