import { Bindings } from "backend";
import { z } from "zod";
import { makeRoute } from "backend/lib/api";
import { Client } from "faunadb";
import { getPhysicalCardById } from "backend/fauna/resources/functions/get_physical_card_by_id";
import { createPhysicalCard } from "backend/fauna/resources/functions/create_physical_card";

export const claim_card_route = makeRoute({
  route: "claim_card",
  input: z.object({
    id: z.string(),
    link: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    let fauna = new Client({
      secret: env.FAUNA_KEY,
      domain: "db.us.fauna.com",
    });
    let card = await getPhysicalCardById(fauna, { id: msg.id });
    if (card)
      return {
        data: { success: false, error: "card already claimed" },
      } as const;

    await createPhysicalCard(fauna, {
      id: msg.id,
      link: msg.link,
      createdAt: Date.now().toString(),
    });

    return { data: { success: true, id: msg.id, link: msg.link } } as const;
  },
});
