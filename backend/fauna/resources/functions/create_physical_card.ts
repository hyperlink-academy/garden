import { Client, query as q } from "faunadb";
import { FunctionDefinition } from "backend/fauna/types";
import { PhysicalCardsByIdIndexName } from "../physical_cards_by_id_index";
import { CreatePhysicalCard } from "../physical_cards_collection";
export const CreatePhysicalCardFunctionName = "create_physical_card";

type Args = {
  createdAt: string;
  id: string;
  link: string;
};

export const createPhysicalCard = (c: Client, args: Args) =>
  c.query(q.Call(q.Function(CreatePhysicalCardFunctionName), args)) as Promise<{
    success: boolean;
  }>;

const definition: FunctionDefinition = {
  name: CreatePhysicalCardFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((args) =>
      q.Let(
        {
          existingCard: q.Match(q.Index(PhysicalCardsByIdIndexName), [
            q.Select("id", args),
          ]),
        },
        q.If(
          q.Exists(q.Var("existingCard")),
          { success: false },
          {
            success: true,
            data: q.Select(
              "data",
              CreatePhysicalCard({
                id: q.Select("id", args),
                createdAt: q.Select("createdAt", args),
                link: q.Select("link", args),
              })
            ),
          }
        )
      )
    )
  ),
};

export default q.CreateFunction(definition);
