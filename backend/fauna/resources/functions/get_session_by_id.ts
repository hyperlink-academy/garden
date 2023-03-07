import { Client, query as q } from "faunadb";
import { SessionsByIdIndexName } from "../sessions/sessions_by_id_index";
import { Session } from "../sessions/session_collection";

export const getSessionByIdFunctionName = "get_session_by_id";

export const getSessionById = (c: Client, args: { id: string }) =>
  c.query(
    q.Call(q.Function(getSessionByIdFunctionName), args)
  ) as Promise<Session | null>;

export default q.CreateFunction({
  name: getSessionByIdFunctionName,
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
          q.Select("data", q.Get(q.Var("indexEntry"))),
          null
        )
      )
    )
  ),
});
