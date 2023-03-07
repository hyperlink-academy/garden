import { query as q } from "faunadb";
import { IndexDefinition } from "backend/fauna/types";
import { SignupTokensCollectionName } from "./signup_tokens_collection";

export const SignupTokensByCodeIndexName = "signup_tokens_by_code";
const Definition: IndexDefinition = {
  name: SignupTokensByCodeIndexName,
  source: q.Collection(SignupTokensCollectionName),
  terms: [{ field: ["data", "code"] }],
  unique: true,
  values: [],
};
export default q.CreateIndex(Definition);
