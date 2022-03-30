import { query as q, Expr, values } from "faunadb";

export const SessionsCollectionName = "sessions";
export type Session = {
  studio: string;
  id: string;
  createdAt: string;
  userAgent: string;
  username: string;
  user: values.Ref;
};

export const CreateSession = (S: { [k in keyof Session]: Expr }) =>
  q.Create(q.Collection(SessionsCollectionName), {
    data: S,
    ttl: q.TimeAdd(q.Now(), 7, "days"),
  });

export default q.CreateCollection({
  name: SessionsCollectionName,
});
