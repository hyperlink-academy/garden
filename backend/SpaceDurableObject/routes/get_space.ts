import { makeRoute } from "backend/lib/api";
import { z } from "zod";
import { Env } from "..";

export const get_space_route = makeRoute({
  route: "get_space",
  input: z.object({ space: z.string() }),
  handler: async (msg, env: Env) => {
    let name = await env.factStore.scanIndex.ave("space/name", msg.space);
    if (!name)
      return {
        data: { success: false, error: "no space with name found" },
      } as const;
    let id = await env.factStore.scanIndex.eav(name.entity, "space/id");
    if (!id)
      return { data: { success: false, error: "no space id found" } } as const;
    return { data: { success: true, id: id.value } };
  },
});
