import { app_event } from "backend/lib/analytics";
import { makeRoute } from "backend/lib/api";
import { Attribute } from "data/Attributes";
import { Fact } from "data/Facts";
import { Message } from "data/Messages";
import { z } from "zod";
import type { WebSocket as DOWebSocket } from "@cloudflare/workers-types";
import { Env } from "..";
import { decodeTime } from "src/ulid";
import { store } from "../fact_store";

export const pullRoute = makeRoute({
  route: "pull",
  input: z.object({
    clientID: z.string(),
    cookie: z.union([
      z.object({
        ephemeralFacts: z.array(z.string()).optional(),
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
    let ephemeralFacts = await getEphemeralFacts(env.state);

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
      ephemeralFacts: ephemeralFacts.map((f) => f.id),
    };

    return {
      data: {
        ephemeralFacts,
        deletedEphemeralFacts:
          msg.cookie?.ephemeralFacts?.filter(
            (k) => !ephemeralFacts.find((f) => f.id === k)
          ) || [],
        cookie: newCookie,
        lastMutationID,
        data: updates,
        messages,
      },
    };
  },
});

async function getEphemeralFacts(state: DurableObjectState) {
  let facts = await state.storage.list<Fact<keyof Attribute>>({
    prefix: "ephemeral-",
  });
  let clients = state.getWebSockets().map(
    (ws) =>
      (ws as unknown as DOWebSocket).deserializeAttachment() as {
        clientID: string;
      }
  );
  let existingFacts = [] as Fact<keyof Attribute>[];
  let fact_store = store(state.storage, { id: "" });
  for (let [key, fact] of facts.entries()) {
    if (Date.now() - decodeTime(fact.id) < 1000 * 5) existingFacts.push(fact);
    if (!!clients.find((c) => key.includes(c?.clientID)))
      existingFacts.push(fact);
    else {
      fact_store.retractEphemeralFact(key.slice(-36), fact.id);
    }
  }
  return existingFacts;
}
