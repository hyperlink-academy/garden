import { query as q } from "faunadb";
import { IndexDefinition } from "../types";
import { IdentitiesCollectionName } from "./identities_collection";

export const IdentitiesByEmailIndexName = "identities_by_email";
const Definition: IndexDefinition = {
  name: IdentitiesByEmailIndexName,
  source: q.Collection(IdentitiesCollectionName),
  terms: [{ field: ["data", "email"] }],
  unique: true,
  values: [],
};
export default q.CreateIndex(Definition);
