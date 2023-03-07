import { FunctionDefinition } from "backend/fauna/types";
import { Client, query as q } from "faunadb";
import { CreateIdentity } from "../identities/identities_collection";
import { SignupTokensByCodeIndexName } from "../signup_tokens/signup_tokens_by_code_index";
import { UpdateSignupToken } from "../signup_tokens/signup_tokens_collection";
import { ValidateNewIdentityFunctionName } from "./validate_new_identity";

export const CreateIdentityFunctionName = "create_identity";

type Args = {
  email: string;
  username: string;
  hashedPassword: string;
  studio: string;
  salt: string;
  code: string;
};

const Errors = {
  invalidUsernameOrEmail: "invalidUsernameOrEmail",
  invalidToken: "invalidToken",
} as const;

export const CreateNewIdentity = (c: Client, args: Args) =>
  c.query(q.Call(q.Function(CreateIdentityFunctionName), args)) as Promise<
    | {
        success: false;
        error: (typeof Errors)[keyof typeof Errors];
      }
    | { success: true }
  >;

const definiton: FunctionDefinition = {
  name: CreateIdentityFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((data) =>
      q.Let(
        {
          validIdentity: q.Call(ValidateNewIdentityFunctionName, data),
          token: q.Match(q.Index(SignupTokensByCodeIndexName), [
            q.Select("code", data),
          ]),
          validToken: q.And(
            q.Exists(q.Var("token")),
            q.Not(q.Select(["data", "used"], q.Get(q.Var("token"))))
          ),
        },
        q.If(
          q.Not(q.Var("validToken")),
          { success: false, error: Errors.invalidToken },
          q.If(
            q.Not(q.Select("valid", q.Var("validIdentity"))),
            {
              success: false,
              error: Errors.invalidUsernameOrEmail,
            },
            q.Do(
              //invalidate token
              UpdateSignupToken(q.Select("ref", q.Get(q.Var("token"))), {
                used: true,
              }),
              // create user
              CreateIdentity({
                studio: q.Select("studio", q.Var("data")),
                email: q.LowerCase(q.Select("email", q.Var("data"))),
                username: q.LowerCase(q.Select("username", q.Var("data"))),
                hashedPassword: q.Select("hashedPassword", q.Var("data")),
                salt: q.Select("salt", q.Var("data")),
              }),
              { success: true }
            )
          )
        )
      )
    )
  ),
};
export default q.CreateFunction(definiton);
