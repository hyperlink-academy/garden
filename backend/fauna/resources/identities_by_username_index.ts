import { query as q } from "faunadb";
import { IndexDefinition } from "../types";
import { IdentitiesCollectionName } from "./identities_collection";

export const IdentitiesByUsernameIndexName = "identities_by_username";
const Definition: IndexDefinition = {
  name: IdentitiesByUsernameIndexName,
  source: q.Collection(IdentitiesCollectionName),
  terms: [{ field: ["data", "username"] }],
  unique: true,
  values: [],
};
export default q.CreateIndex(Definition);
