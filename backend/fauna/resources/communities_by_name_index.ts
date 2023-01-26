import { query as q } from "faunadb";
import { IndexDefinition } from "../types";
import { CommunitiesCollectionName } from "./communities_collection";

export const CommunitiesByNameIndexName = "communities_by_name";
const Definition: IndexDefinition = {
  name: CommunitiesByNameIndexName,
  source: q.Collection(CommunitiesCollectionName),
  terms: [{ field: ["data", "name"] }],
  unique: true,
  values: [],
};
export default q.CreateIndex(Definition);
