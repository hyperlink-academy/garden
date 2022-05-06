import { query as q } from "faunadb";
import { IndexDefinition } from "../types";
import { PhysicalCardsCollectionName } from "./physical_cards_collection";

export const PhysicalCardsByIdIndexName = "physical_cards_by_id2";
const Definition: IndexDefinition = {
  name: PhysicalCardsByIdIndexName,
  source: q.Collection(PhysicalCardsCollectionName),
  terms: [{ field: ["data", "id"] }],
  unique: true,
  values: [],
};
export default q.CreateIndex(Definition);
