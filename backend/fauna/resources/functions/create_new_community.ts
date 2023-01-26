import { Client, query as q } from "faunadb";
import { FunctionDefinition } from "backend/fauna/types";
import {
  Community,
  CreateCommunity,
} from "backend/fauna/resources/communities_collection";
export const CreateCommunityFunctionName = "create_collection";

type Args = {
  name: string;
  spaceID: string;
};

export const createCommunity = (c: Client, args: Args) =>
  c.query(q.Call(q.Function(CreateCommunityFunctionName), args)) as Promise<
    | { success: false; error: "NoUserFound" }
    | { success: true; data: Community }
  >;

const definition: FunctionDefinition = {
  name: CreateCommunityFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((a) => {
      let args = (value: keyof Args) => q.Select(value, a);
      return q.Let(
        {},
        {
          success: true,
          data: q.Select(
            "data",
            CreateCommunity({
              name: args("name"),
              spaceID: args("spaceID"),
            })
          ),
        }
      );
    })
  ),
};

export default q.CreateFunction(definition);
