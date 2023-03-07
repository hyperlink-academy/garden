import { Client, query as q } from "faunadb";
import { SignupTokensByCodeIndexName } from "../signup_tokens/signup_tokens_by_code_index";
import { SignupToken } from "../signup_tokens/signup_tokens_collection";

export const getSignupTokenFunctionName = "get_signup_token";

export const getSignupToken = (c: Client, args: { code: string }) =>
  c.query(
    q.Call(q.Function(getSignupTokenFunctionName), args)
  ) as Promise<SignupToken | null>;

export default q.CreateFunction({
  name: getSignupTokenFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((args) =>
      q.Let(
        {
          indexEntry: q.Match(q.Index(SignupTokensByCodeIndexName), [
            q.Select("code", args),
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
