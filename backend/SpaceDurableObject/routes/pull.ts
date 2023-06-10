import { app_event } from "backend/lib/analytics";
import { makeRoute } from "backend/lib/api";
import { Attribute } from "data/Attributes";
import { Fact } from "data/Facts";
import { Message } from "data/Messages";
import { z } from "zod";
import { Env } from "..";

export const pullRoute = makeRoute({
  route: "pull",
  input: z.object({
    clientID: z.string(),
    cookie: z.union([
      z.object({
        lastUpdated: z.union([z.string(), z.number()]),
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
    let facts = await env.storage.list<Fact<keyof Attribute>>({
      prefix: `ti`,
      start: `ti-${lastUpdated}`,
    });
    let messages = [
      ...(
        await env.storage.list<Message>({
          prefix: `messages`,
          start: `messages-${lastUpdated}`,
        })
      ).values(),
    ];
    let updates = [...facts.values()].filter(
      (f) => !lastUpdated || f.lastUpdated > lastUpdated
    );

    let newLastUpdated = lastUpdated || Date.now().toString();
    let lastKey = updates[updates.length - 1]?.lastUpdated;
    let lastMessage =
      messages[messages.length - 1]?.server_ts ||
      messages[messages.length - 1]?.ts;
    if (lastKey && lastKey > newLastUpdated) newLastUpdated = lastKey;
    if (lastMessage && lastMessage > newLastUpdated)
      newLastUpdated = lastMessage;
    let newCookie: typeof msg.cookie = {
      lastUpdated: newLastUpdated,
    };
    app_event(env.env, {
      event: "pulled_from_space",
      user: "",
      spaceID: env.id,
    });

    return {
      data: {
        cookie: newCookie,
        lastMutationID,
        data: updates,
        messages,
      },
    };
  },
});
