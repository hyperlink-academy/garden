import { Client, query as q } from "faunadb";
import { IdentitiesByUsernameIndexName } from "../identities_by_username_index";
import { Identity } from "../identities_collection";

export const getIdentityByUsernameFunctionName = "get_identity_by_username";

export const getIdentityByUsername = (c: Client, args: { username: string }) =>
  c.query(
    q.Call(q.Function(getIdentityByUsernameFunctionName), args)
  ) as Promise<Identity | null>;

export default q.CreateFunction({
  name: getIdentityByUsernameFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((args) =>
      q.Let(
        {
          indexEntry: q.Match(q.Index(IdentitiesByUsernameIndexName), [
            q.Select("username", args),
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
