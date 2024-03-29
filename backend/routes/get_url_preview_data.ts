import { z } from "zod";
import { Bindings } from "backend";
import { makeRoute } from "backend/lib/api";
import { createClient } from "backend/lib/supabase";

let expectedAPIResponse = z.object({
  data: z.object({
    description: z.string().optional().nullable(),
    author: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    image: z
      .object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
      })
      .nullable()
      .optional(),
    logo: z
      .object({
        url: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
      .nullable()
      .optional(),
  }),
});

export const get_url_preview_data_route = makeRoute({
  route: "get_url_preview_data",
  input: z.object({
    url: z.string(),
  }),
  handler: async (msg, env: Bindings) => {
    let result = await get_url_preview_data(msg.url, env);
    if (!result.success)
      return {
        data: { success: false, result } as const,
      };
    let data = result.data.data;
    return {
      data: {
        success: true,
        description: data.description,
        author: data.author,
        title: data.title,
        image: data.image,
        logo: data.logo,
      },
    } as const;
  },
});

export const get_url_preview_data = async (url: string, env: Bindings) => {
  let response = await fetch(`https://pro.microlink.io/?url=${url}`, {
    headers: {
      "x-api-key": env.MICROLINK_API_KEY,
    },
  });

  let result = expectedAPIResponse.safeParse(await response.json());
  return result;
};
