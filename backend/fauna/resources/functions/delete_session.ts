import { Client, query as q } from "faunadb";
import { SessionsByIdIndexName } from "../sessions_by_id_index";

export const deleteSessionFunctionName = "delete_session";

export const deleteSession = (c: Client, args: { id: string }) =>
  c.query(q.Call(q.Function(deleteSessionFunctionName), args)) as Promise<void>;

export default q.CreateFunction({
  name: deleteSessionFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((args) =>
      q.Let(
        {
          indexEntry: q.Match(q.Index(SessionsByIdIndexName), [
            q.Select("id", args),
          ]),
        },
        q.If(
          q.Exists(q.Var("indexEntry")),
          q.Delete(q.Select("ref", q.Get(q.Var("indexEntry")))),
          null
        )
      )
    )
  ),
});
