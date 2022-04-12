import { Expr, query as q } from "faunadb";

export type SignupToken = {
  code: string;
  used: boolean;
  message?: string;
};

export const SignupTokensCollectionName = "signup_tokens";
export const UpdateSignupToken = (
  ref: Expr,
  data: Partial<{ [k in keyof SignupToken]: Expr | SignupToken[k] }>
) => q.Update(ref, { data });

export default q.CreateCollection({ name: SignupTokensCollectionName });
