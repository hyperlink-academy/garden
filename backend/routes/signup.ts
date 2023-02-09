import { z } from "zod";
import { Bindings } from "backend";
import { Client } from "faunadb";
import bcrypt from "bcryptjs";
import { CreateNewIdentity } from "backend/fauna/resources/functions/create_identity";
import { internalSpaceAPI, makeRoute } from "backend/lib/api";
import { app_event } from "backend/lib/analytics";

export const SignupRoute = makeRoute({
  route: "signup",
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
    let newSpaceID = env.SPACES.newUniqueId();
    let result = await CreateNewIdentity(fauna, {
      ...msg,
      salt,
      studio: newSpaceID.toString(),
      hashedPassword,
    });

    if (!result.success) {
      return { data: { success: false, error: result.error } } as const;
    }

    let stub = env.SPACES.get(newSpaceID);
    let newSpace = internalSpaceAPI(stub);
    let res = await newSpace("http://internal", "claim", {
      data: {
        name: msg.username,
        start_date: "",
        end_date: "",
        description: "",
      },
      name: msg.username,
      ownerID: newSpaceID.toString(),
      ownerName: msg.username,
    });
    app_event(env, {
      event: "signup",
      spaceID: newSpaceID.toString(),
      user: msg.username,
    });
    return { data: { success: true } } as const;
  },
});
