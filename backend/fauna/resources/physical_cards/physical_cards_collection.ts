import { query as q, Expr, values } from "faunadb";

export const PhysicalCardsCollectionName = "physical_cards";
export type PhysicalCard = {
  id: string;
  createdAt: string;
  link: string;
};

export const CreatePhysicalCard = (S: { [k in keyof PhysicalCard]: Expr }) =>
  q.Create(q.Collection(PhysicalCardsCollectionName), {
    data: S,
  });

export default q.CreateCollection({
  name: PhysicalCardsCollectionName,
});
