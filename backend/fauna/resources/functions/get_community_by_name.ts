import { Client, query as q } from "faunadb";
import { CommunitiesByNameIndexName } from "../communities/communities_by_name_index";
import { Community } from "../communities/communities_collection";

export const getCommunityByNameFunctionName = "get_community_by_name";

export const getCommunityByName = (c: Client, args: { name: string }) =>
  c.query(
    q.Call(q.Function(getCommunityByNameFunctionName), args)
  ) as Promise<Community | null>;

export default q.CreateFunction({
  name: getCommunityByNameFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((args) =>
      q.Let(
        {
          indexEntry: q.Match(q.Index(CommunitiesByNameIndexName), [
            q.Select("name", args),
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
