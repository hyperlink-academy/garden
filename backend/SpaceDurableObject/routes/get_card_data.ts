import { Env } from "..";
import { makeRoute } from "backend/lib/api";
import { z } from "zod";

export const get_card_data_route = makeRoute({
  route: "get_card_data",
  input: z.object({
    cardEntity: z.string(),
  }),
  handler: async (msg, env: Env) => {
    return {
      data: {
        title: undefined as undefined | string,
        content: undefined as undefined | string,
        creator: undefined as undefined | string,
      },
    };
  },
});
