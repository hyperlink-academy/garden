import { query as q } from "faunadb";
import { IndexDefinition } from "backend/fauna/types";
import { SessionsCollectionName } from "./session_collection";

export const SessionsByIdIndexName = "sessions_by_id";
const Definition: IndexDefinition = {
  name: SessionsByIdIndexName,
  source: q.Collection(SessionsCollectionName),
  unique: true,
  terms: [{ field: ["data", "id"] }],
  values: [],
};
export default q.CreateIndex(Definition);
