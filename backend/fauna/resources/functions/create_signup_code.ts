import { FunctionDefinition } from "backend/fauna/types";
import { Client, Expr, query as q } from "faunadb";
import { SignupTokensByCodeIndexName } from "../signup_tokens_by_code_index";
import {
  SignupToken,
  SignupTokensCollectionName,
} from "../signup_tokens_collection";

export const createSignupCodeFunctionName = "create_signup_code";

type Args = { code: string; message: string };
export const createSignupCode = (c: Client, args: Args) =>
  c.query(q.Call(q.Function(createSignupCodeFunctionName), args)) as Promise<
    { success: false } | { success: true; data: SignupToken }
  >;

const definition: FunctionDefinition = {
  name: createSignupCodeFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((a) => {
      let args = (value: keyof Args) => q.Select(value, a);
      let data: { [k in keyof SignupToken]: Expr | SignupToken[k] } = {
        used: false,
        code: args("code"),
        message: args("message"),
      };
      return q.Let(
        {
          indexEntry: q.Match(q.Index(SignupTokensByCodeIndexName), [
            args("code"),
          ]),
        },
        q.If(
          q.Exists(q.Var("indexEntry")),
          { success: false },
          {
            success: true,
            data: q.Select(
              "data",
              q.Create(q.Collection(SignupTokensCollectionName), { data })
            ),
          }
        )
      );
    })
  ),
};

export default q.CreateFunction(definition);
