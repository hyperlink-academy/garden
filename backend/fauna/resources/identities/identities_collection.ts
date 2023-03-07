import { Expr, query as q } from "faunadb";

export const IdentitiesCollectionName = "identities";

export type Identity = {
  email: string;
  username: string;
  studio: string;
  hashedPassword: string;
  salt: string;
};

export const CreateIdentity = (I: { [k in keyof Identity]: Expr }) =>
  q.Create(q.Collection(IdentitiesCollectionName), {
    data: I,
  });

export default q.CreateCollection({
  name: IdentitiesCollectionName,
});
