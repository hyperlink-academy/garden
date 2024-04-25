import { makeRoute } from "backend/lib/api";
import { Attribute } from "data/Attributes";
import { Fact } from "data/Facts";
import { Message } from "data/Messages";
import { z } from "zod";
import type { WebSocket as DOWebSocket } from "@cloudflare/workers-types";
import { Env } from "..";
import { decodeTime } from "src/ulid";
import { store } from "../fact_store";
import { ClientGroup } from "./push";
import { useMutations } from "hooks/useReplicache";
import { useState } from "react";

export const pullRoute = makeRoute({
  route: "pull",
  input: z.object({
    clientGroupID: z.string(),
    cookie: z.union([
      z.object({
        ephemeralFacts: z.array(z.string()).optional(),
        lastUpdated: z.union([z.string(), z.number()]),
        order: z.union([z.string(), z.number()]),
      }),
      z.undefined(),
      z.null(),
    ]),
    pullVersion: z.number(),
    schemaVersion: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let release = await env.pushLock.lock();
    let clientGroup =
      (await env.storage.get<ClientGroup>(
        `clientGroup-${msg.clientGroupID}`
      )) || {};

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
    let lastEphemeralFact =
      ephemeralFacts[ephemeralFacts.length - 1]?.lastUpdated;
    if (lastKey && lastKey > newLastUpdated) newLastUpdated = lastKey;
    if (lastMessage && lastMessage > newLastUpdated)
      newLastUpdated = lastMessage;
    if (lastEphemeralFact && lastEphemeralFact > newLastUpdated)
      newLastUpdated = lastEphemeralFact;
    let newCookie: typeof msg.cookie = {
      lastUpdated: newLastUpdated,
      order: newLastUpdated,
      ephemeralFacts: ephemeralFacts.map((f) => f.id),
    };
    release();

    return {
      data: {
        ephemeralFacts,
        deletedEphemeralFacts:
          msg.cookie?.ephemeralFacts?.filter(
            (k) => !ephemeralFacts.find((f) => f.id === k)
          ) || [],
        cookie: newCookie,
        lastMutationIDChanges: Object.fromEntries(
          Object.entries(clientGroup).map(([k, v]) => [k, v.lastMutationID])
        ),
        data: updates,
        messages,
      },
    };
  },
});

async function getEphemeralFacts(state: DurableObjectState) {
  let facts = [
    ...(
      await state.storage.list<Fact<keyof Attribute>>({
        prefix: "ephemeral-",
      })
    ).entries(),
  ];
  let existingFacts = [] as Fact<keyof Attribute>[];
  let fact_store = store(state.storage, { id: "" });
  for (let [key, fact] of facts) {
    let clientID = key.slice(37);
    let clientFact = facts.find(
      ([, f]) => f.attribute === "presence/client-id" && f.value === clientID
    );
    if (
      clientFact &&
      Date.now() - parseInt(clientFact[1].lastUpdated) < 1000 * 60 * 2
    ) {
      existingFacts.push(fact);
    } else {
      await fact_store.retractEphemeralFact(key.slice(-36), fact.id);
    }
  }
  return existingFacts;
}
