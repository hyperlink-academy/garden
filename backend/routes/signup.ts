import { z } from "zod";
import { Bindings } from "backend";
import { Client } from "faunadb";
import bcrypt from "bcryptjs";
import { CreateNewIdentity } from "backend/fauna/resources/functions/create_identity";
import { makeAPIClient, makeRoute } from "backend/lib/api";
import { SpaceRoutes } from "backend/SpaceDurableObject";

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
    let newSpace = makeAPIClient<SpaceRoutes>(stub.fetch.bind(stub));
    let res = await newSpace("http://internal", "claim", {
      name: msg.username,
      ownerID: newSpaceID.toString(),
      ownerName: msg.username,
    });
    console.log(res);
    return { data: { success: true } } as const;
  },
});
