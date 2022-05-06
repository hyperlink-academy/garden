import { Client, query as q } from "faunadb";
import { PhysicalCardsByIdIndexName } from "../physical_cards_by_id_index";
import { PhysicalCard } from "../physical_cards_collection";

export const getPhysicalCardByIdFunctionName = "get_physical_card_by_id";

export const getPhysicalCardById = (c: Client, args: { id: string }) =>
  c.query(
    q.Call(q.Function(getPhysicalCardByIdFunctionName), args)
  ) as Promise<PhysicalCard | null>;

export default q.CreateFunction({
  name: getPhysicalCardByIdFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((args) =>
      q.Let(
        {
          indexEntry: q.Match(q.Index(PhysicalCardsByIdIndexName), [
            q.Select("id", args),
          ]),
        },
        q.If(
          q.Exists(q.Var("indexEntry")),
          q.Select("data", q.Get(q.Var("indexEntry"))),
          null
        )
      )
    )
  ),
});
