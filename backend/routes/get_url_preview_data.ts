import { z } from "zod";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";

let expectedAPIResponse = z.object({
  data: z.object({
    description: z.string().optional(),
    author: z.string().optional(),
    title: z.string().optional(),
  }),
});

export const get_url_preview_data_route = makeRoute({
  route: "get_url_preview_data",
  input: z.object({
    url: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    let response = await fetch(`https://pro.microlink.io/?url=${msg.url}`, {
      headers: {
        "x-api-key": env.MICROLINK_API_KEY,
      },
    });
    let result = expectedAPIResponse.safeParse(await response.json());
    if (!result.success)
      return {
        data: { success: false },
      };
    let data = result.data.data;
    return {
      data: {
        success: true,
        description: data.description,
        author: data.author,
        title: data.title,
      },
    };
  },
});
