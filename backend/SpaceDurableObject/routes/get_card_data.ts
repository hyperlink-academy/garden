import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";

export const get_card_data_route = makeRoute({
  route: "get_card_data",
  input: z.object({
    cardEntity: z.string(),
  }),
  handler: async (msg, env: Env) => {
    let title = await env.factStore.scanIndex.eav(msg.cardEntity, "card/title");
    let content = await env.factStore.scanIndex.eav(
      msg.cardEntity,
      "card/content"
    );
    let creator = await env.factStore.scanIndex.eav(
      msg.cardEntity,
      "card/created-by"
    );
    let creatorName;
    if (creator)
      creatorName = await env.factStore.scanIndex.eav(
        creator.value.value,
        "member/name"
      );

    return {
      data: {
        title: title?.value,
        content: content?.value,
        creator: creatorName?.value,
      },
    };
  },
});
