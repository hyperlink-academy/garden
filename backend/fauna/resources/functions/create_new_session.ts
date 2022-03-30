import { Client, query as q } from "faunadb";
import { FunctionDefinition } from "backend/fauna/types";
import { CreateSession } from "../session_collection";
import { IdentitiesByUsernameIndexName } from "../identities_by_username_index";
export const CreateSessionFunctionName = "create_session";

type Args = {
  username: string;
  studio: string;
  createdAt: string;
  userAgent: string;
  id: string;
};

export const createSession = (c: Client, args: Args) =>
  c.query(q.Call(q.Function(CreateSessionFunctionName), args)) as Promise<
    { success: false; error: "NoUserFound" } | { success: true }
  >;

const definition: FunctionDefinition = {
  name: CreateSessionFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((args) =>
      q.Let(
        {
          identity: q.Match(q.Index(IdentitiesByUsernameIndexName), [
            q.LowerCase(q.Select("username", args)),
          ]),
        },
        q.If(
          q.Not(q.Exists(q.Var("identity"))),
          { success: false, error: "NoUserFound" },
          q.Do(
            CreateSession({
              studio: q.Select("studio", args),
              id: q.Select("id", args),
              username: q.Select("username", args),
              createdAt: q.Select("createdAt", args),
              userAgent: q.Select("userAgent", args),
              user: q.Select("ref", q.Get(q.Var("identity"))),
            }),
            { success: true }
          )
        )
      )
    )
  ),
};

export default q.CreateFunction(definition);
