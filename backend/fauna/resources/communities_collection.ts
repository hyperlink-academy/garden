import { query as q, Expr } from "faunadb";

export const CommunitiesCollectionName = "communities";
export type Community = {
  spaceID: string;
  name: string;
};

export const CreateCommunity = (S: { [k in keyof Community]: Expr }) =>
  q.Create(q.Collection(CommunitiesCollectionName), {
    data: S,
  });

export default q.CreateCollection({
  name: CommunitiesCollectionName,
});
