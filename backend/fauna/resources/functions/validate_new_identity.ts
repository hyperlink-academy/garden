import { FunctionDefinition } from "backend/fauna/types";
import { Client, query as q } from "faunadb";
import { IdentitiesByEmailIndexName } from "../identities/identities_by_email_index";
import { IdentitiesByUsernameIndexName } from "../identities/identities_by_username_index";

export const ValidateNewIdentityFunctionName = "validate_new_identity";

type Args = {
  email: string;
  username: string;
};
export const validateNewIdentity = (c: Client, args: Args) =>
  c.query(
    q.Call(q.Function(ValidateNewIdentityFunctionName), args)
  ) as Promise<{ emailTaken: string }>;

const definition: FunctionDefinition = {
  name: ValidateNewIdentityFunctionName,
  role: "server",
  body: q.Query(
    q.Lambda((data) =>
      q.Let(
        {
          email: q.Exists(
            q.Match(q.Index(IdentitiesByEmailIndexName), [
              q.LowerCase(q.Select("email", data)),
            ])
          ),
          username: q.Exists(
            q.Match(q.Index(IdentitiesByUsernameIndexName), [
              q.LowerCase(q.Select("username", data)),
            ])
          ),
        },
        {
          emailTaken: q.Var("email"),
          usernameTaken: q.Var("username"),
          valid: q.And(q.Not(q.Var("email")), q.Not(q.Var("username"))),
        }
      )
    )
  ),
};

export default q.CreateFunction(definition);
