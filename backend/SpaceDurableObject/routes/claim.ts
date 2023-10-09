import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { Env } from "..";

export const claimRoute = makeRoute({
  route: "claim",
  input: z.object({
    ownerID: z.string(),
    ownerName: z.string(),
    type: z.union([z.literal("space"), z.literal("studio"), z.literal("user")]),
  }),
  handler: async (msg, env: Env) => {
    let creator = await env.storage.get("meta-creator");
    let space_type = await env.storage.get<string>("meta-space-type");
    if (creator || space_type) return { data: { success: false } };

    await Promise.all([
      env.storage.put("meta-creator", msg.ownerID),
      env.storage.put("meta-space-type", msg.type),
    ]);
    return { data: { success: true } };
  },
});
