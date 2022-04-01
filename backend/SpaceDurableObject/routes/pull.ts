import { makePOSTRoute } from "backend/lib/api";
import { Attribute } from "data/Attributes";
import { Fact } from "data/Facts";
import { z } from "zod";
import { Env } from "..";

export const pullRoute = makePOSTRoute({
  route: "pull",
  input: z.object({
    clientID: z.string(),
    cookie: z.union([
      z.object({
        lastUpdated: z.string(),
      }),
      z.undefined(),
      z.null(),
    ]),
    lastMutationID: z.number(),
    pullVersion: z.number(),
    schemaVersion: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let lastMutationID =
      (await env.storage.get<number>(`lastMutationID-${msg.clientID}`)) || 0;

    let lastUpdated = msg.cookie?.lastUpdated || "";
    let map = await env.storage.list<Fact<keyof Attribute>>({
      prefix: `ti`,
      start: `ti-${lastUpdated}`,
    });
    let updates = [...map.values()].filter(
      (f) => !lastUpdated || f.lastUpdated > lastUpdated
    );

    let lastKey = updates[updates.length - 1];
    let newCookie: typeof msg.cookie = {
      lastUpdated: lastUpdated || lastKey?.lastUpdated || Date.now().toString(),
    };

    return {
      data: {
        cookie: newCookie,
        lastMutationID,
        data: updates,
      },
    };
  },
});
