import { z } from "zod";
import { Bindings } from "backend";
import { Client } from "faunadb";
import bcrypt from "bcryptjs";
import { CreateNewIdentity } from "backend/fauna/resources/functions/create_identity";
import { makePOSTRoute } from "backend/lib/api";

export const SignupRoute = makePOSTRoute({
  cmd: "signup",
  input: z.object({
    email: z.string().email(),
    username: z.string(),
    password: z.string(),
    code: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });

    // Validate their signup token
    let salt = await bcrypt.genSalt();
    let hashedPassword = await bcrypt.hash(msg.password, salt);
    let newSpace = env.SPACES.newUniqueId().toString();
    let result = await CreateNewIdentity(fauna, {
      ...msg,
      salt,
      studio: newSpace,
      hashedPassword,
    });

    if (!result.success) {
      return { data: { success: false, error: result.error } };
    }
    return { data: { success: true } };
  },
});
