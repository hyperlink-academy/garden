import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Env } from "..";
import { ulid } from "src/ulid";
import { Attribute } from "data/Attributes";
export const bot_mutation_route = makeRoute({
  route: "bot_mutation",
  input: z.object({
    token: z.string(),
    mutations: z.array(
      z.discriminatedUnion("cmd", [
        z.object({
          cmd: z.literal("postMessage"),
          message: z.object({
            entity: z.optional(z.string()),
            topic: z.string(),
            sender: z.string(),
            content: z.string(),
          }),
        }),
        z.object({
          cmd: z.literal("assertFact"),
          data: z.object({
            entity: z.string(),
            attribute: z.string(),
            value: z.union([
              z.string(),
              z.boolean(),
              z.object({ type: z.literal("reference"), value: z.string() }),
              z.object({ type: z.literal("flag") }),
            ]),
            positions: z.record(z.string(), z.string()),
          }),
        }),
        z.object({ cmd: z.literal("updateFact"), id: z.string() }),
        z.object({ cmd: z.literal("retractFact"), id: z.string() }),
      ])
    ),
  }),
  handler: async (msg, env: Env) => {
    //TODO this has gotta be secured somehow! Short lived tokens passed in the
    //webhook I think
    //Only tricky bit is invalidating them
    for (let i = 0; i < msg.mutations.length; i++) {
      let mutation = msg.mutations[i];
      switch (mutation.cmd) {
        case "postMessage": {
          await env.factStore.postMessage(
            {
              ...mutation.message,
              ts: Date.now().toString(),
              id: ulid(),
            },
            { ignoreBots: true }
          );
          break;
        }
        case "assertFact": {
          await env.factStore.assertFact({
            attribute: mutation.data.attribute as keyof Attribute,
            entity: mutation.data.entity,
            value: mutation.data.value,
            positions: mutation.data.positions,
          });
        }
      }
    }
    env.poke();
    return { data: { success: true } };
  },
});
